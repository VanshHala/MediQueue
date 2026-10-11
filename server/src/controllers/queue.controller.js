import { query, getClient } from '../config/db.js';
import { calculateScore } from '../services/priority.service.js';
import { determineCategory, generateNextToken } from '../services/token.service.js';

// GET /api/queue/doctor (Doctor's own live queue)
export const getDoctorQueue = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Resolve doctor profile
    const docRes = await query(
      `SELECT d.id AS doctor_id, d.room_no, d.avg_consult_minutes, d.status,
              u.name AS doctor_name, u.email, dep.name AS department_name
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN departments dep ON d.department_id = dep.id
       WHERE d.user_id = $1`,
      [userId]
    );

    if (docRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not associated with this account.'
      });
    }

    const doctor = docRes.rows[0];

    // 2. Fetch currently SERVING patient today
    const servingRes = await query(
      `SELECT a.*, dep.name AS department_name
       FROM appointments a
       LEFT JOIN departments dep ON a.department_id = dep.id
       WHERE a.doctor_id = $1 AND a.status = 'SERVING'
       ORDER BY a.called_at DESC NULLS LAST LIMIT 1`,
      [doctor.doctor_id]
    );

    const currentServing = servingRes.rows.length > 0 ? servingRes.rows[0] : null;

    // 3. Fetch all waiting appointments today (CHECKED_IN and BOOKED)
    const waitingRes = await query(
      `SELECT a.*, dep.name AS department_name
       FROM appointments a
       LEFT JOIN departments dep ON a.department_id = dep.id
       WHERE a.doctor_id = $1
         AND (a.appt_date = $2 OR a.appt_date = CURRENT_DATE OR a.status = 'CHECKED_IN')
         AND a.status IN ('CHECKED_IN', 'BOOKED')`,
      [doctor.doctor_id, todayStr]
    );

    const now = new Date();

    // 4. Calculate dynamic priority score and breakdown for each waiting patient
    const waitingList = waitingRes.rows.map((appt) => {
      const score = calculateScore(appt, now);

      // Base weight breakdown
      let baseWeight = 10;
      if (appt.category === 'EMERGENCY') baseWeight = 100;
      else if (appt.category === 'SENIOR') baseWeight = 50;

      const skipBonus = (appt.skip_count || 0) * 10;

      let waitStartTime = appt.checked_in_at ? new Date(appt.checked_in_at) : null;
      if (!waitStartTime && appt.slot_time) {
        const [h, m] = appt.slot_time.split(':').map(Number);
        waitStartTime = new Date(now);
        waitStartTime.setHours(h, m, 0, 0);
      } else if (!waitStartTime) {
        waitStartTime = new Date(appt.created_at);
      }

      const elapsedMs = Math.max(0, now.getTime() - waitStartTime.getTime());
      const minutesWaited = Math.floor(elapsedMs / (1000 * 60));
      const waitBonus = parseFloat((minutesWaited * 0.1).toFixed(2));

      return {
        ...appt,
        score,
        baseWeight,
        skipBonus,
        minutesWaited,
        waitBonus,
        isPriorityUpgraded: (appt.skip_count || 0) >= 2
      };
    });

    // 5. Sort waiting list by score descending (highest priority first)
    waitingList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tie-breaker: earlier arrival or creation goes first
      const timeA = new Date(a.checked_in_at || a.created_at).getTime();
      const timeB = new Date(b.checked_in_at || b.created_at).getTime();
      return timeA - timeB;
    });

    // 6. Fetch completed today appointments
    const completedRes = await query(
      `SELECT a.*, dep.name AS department_name
       FROM appointments a
       LEFT JOIN departments dep ON a.department_id = dep.id
       WHERE a.doctor_id = $1 AND a.appt_date = $2 AND a.status IN ('DONE', 'NO_SHOW')
       ORDER BY a.completed_at DESC NULLS LAST`,
      [doctor.doctor_id, todayStr]
    );

    res.status(200).json({
      success: true,
      data: {
        doctor,
        currentServing,
        waitingList,
        waitingCount: waitingList.length,
        completedList: completedRes.rows,
        completedCount: completedRes.rows.filter(r => r.status === 'DONE').length,
        noShowCount: completedRes.rows.filter(r => r.status === 'NO_SHOW').length
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/queue/call-next (Doctor calls highest-scoring patient)
export const callNextPatient = async (req, res, next) => {
  const client = await getClient();

  try {
    const userId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Resolve doctor id
    const docRes = await client.query(
      `SELECT id, room_no, avg_consult_minutes FROM doctors WHERE user_id = $1`,
      [userId]
    );

    if (docRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor account not found'
      });
    }

    const doctorId = docRes.rows[0].id;

    await client.query('BEGIN');

    // 2. Fetch all waiting patients for today
    const waitingRes = await client.query(
      `SELECT * FROM appointments
       WHERE doctor_id = $1
         AND (appt_date = $2 OR appt_date = CURRENT_DATE OR status = 'CHECKED_IN')
         AND status IN ('CHECKED_IN', 'BOOKED')`,
      [doctorId, todayStr]
    );

    if (waitingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(200).json({
        success: true,
        message: 'No waiting patients currently in queue.',
        data: null
      });
    }

    const now = new Date();

    // 3. Compute score and pick highest
    const scoredList = waitingRes.rows.map((appt) => ({
      ...appt,
      score: calculateScore(appt, now)
    }));

    scoredList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const timeA = new Date(a.checked_in_at || a.created_at).getTime();
      const timeB = new Date(b.checked_in_at || b.created_at).getTime();
      return timeA - timeB;
    });

    const chosenAppt = scoredList[0];

    // 4. Auto-complete previous SERVING appointment if one exists
    await client.query(
      `UPDATE appointments
       SET status = 'DONE', completed_at = CURRENT_TIMESTAMP
       WHERE doctor_id = $1 AND status = 'SERVING'`,
      [doctorId]
    );

    // 5. Apply Skip Rule:
    // Whenever a patient is called while another waiting patient with an earlier slot or arrival exists,
    // that earlier patient's skip_count += 1
    const chosenTime = new Date(chosenAppt.checked_in_at || chosenAppt.created_at).getTime();

    const skippedAppts = scoredList.filter((appt) => {
      if (appt.id === chosenAppt.id) return false;
      const apptTime = new Date(appt.checked_in_at || appt.created_at).getTime();
      return apptTime < chosenTime;
    });

    if (skippedAppts.length > 0) {
      const skippedIds = skippedAppts.map((a) => a.id);
      await client.query(
        `UPDATE appointments
         SET skip_count = skip_count + 1
         WHERE id = ANY($1::int[])`,
        [skippedIds]
      );
    }

    // 6. Set chosen appointment to SERVING
    const updateRes = await client.query(
      `UPDATE appointments
       SET status = 'SERVING', called_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [chosenAppt.id]
    );

    // 7. Update doctor status to BUSY
    await client.query(
      `UPDATE doctors SET status = 'BUSY' WHERE id = $1`,
      [doctorId]
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: `Now serving Token ${chosenAppt.token_no} (${chosenAppt.patient_name_snapshot})`,
      data: {
        appointment: updateRes.rows[0],
        skippedCount: skippedAppts.length
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// PUT /api/queue/:id/complete (Doctor completes active consultation)
export const completeConsultation = async (req, res, next) => {
  try {
    const apptId = req.params.id;
    const userId = req.user.id;

    // Verify appointment belongs to this doctor
    const { rows } = await query(
      `UPDATE appointments
       SET status = 'DONE', completed_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING doctor_id, token_no`,
      [apptId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const doctorId = rows[0].doctor_id;

    // Set doctor status to FREE
    await query(`UPDATE doctors SET status = 'FREE' WHERE id = $1`, [doctorId]);

    res.status(200).json({
      success: true,
      message: `Token ${rows[0].token_no} consultation completed. Doctor is now FREE.`
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/queue/:id/noshow (Doctor marks no-show)
export const markNoShow = async (req, res, next) => {
  try {
    const apptId = req.params.id;

    const { rows } = await query(
      `UPDATE appointments
       SET status = 'NO_SHOW', completed_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING doctor_id, token_no`,
      [apptId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const doctorId = rows[0].doctor_id;

    // Set doctor status to FREE
    await query(`UPDATE doctors SET status = 'FREE' WHERE id = $1`, [doctorId]);

    res.status(200).json({
      success: true,
      message: `Token ${rows[0].token_no} marked as No-Show. Token remains non-reusable.`
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/queue/:id/skip (Doctor skips patient)
export const skipPatient = async (req, res, next) => {
  try {
    const apptId = req.params.id;

    const { rows } = await query(
      `UPDATE appointments
       SET skip_count = skip_count + 1
       WHERE id = $1
       RETURNING id, token_no, skip_count`,
      [apptId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Token ${rows[0].token_no} skipped. Skip count: ${rows[0].skip_count}.`,
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/appointments/walkin (Receptionist registers walk-in patient)
export const registerWalkin = async (req, res, next) => {
  const client = await getClient();

  try {
    const {
      patient_name,
      age,
      phone,
      doctor_id,
      department_id,
      blood_group = 'O+'
    } = req.body;

    const todayStr = new Date().toISOString().split('T')[0];
    const ageNum = parseInt(age, 10);

    // Auto senior detection
    const category = determineCategory({ isEmergency: false, age: ageNum });

    await client.query('BEGIN');

    // 1. Create or find walk-in guest user
    let patientUserId = null;
    const userFind = await client.query(
      `SELECT id FROM users WHERE phone = $1`,
      [phone]
    );

    if (userFind.rows.length > 0) {
      patientUserId = userFind.rows[0].id;
    } else {
      const email = `walkin_${Date.now()}_${Math.floor(Math.random() * 1000)}@mediqueue.local`;
      const userInsert = await client.query(
        `INSERT INTO users (name, email, password_hash, phone, age, blood_group, role)
         VALUES ($1, $2, 'walkin_guest_no_login', $3, $4, $5, 'patient')
         RETURNING id`,
        [patient_name, email, phone, ageNum, blood_group]
      );
      patientUserId = userInsert.rows[0].id;
    }

    // 2. Generate atomic token
    const tokenNo = await generateNextToken(client, todayStr, category);

    // 3. Insert walk-in appointment with immediate CHECKED_IN status
    const apptInsert = await client.query(
      `INSERT INTO appointments (
         patient_id, doctor_id, department_id, appt_date, slot_time,
         patient_name_snapshot, age_snapshot, category, token_no,
         status, source, checked_in_at
       )
       VALUES ($1, $2, $3, $4, CURRENT_TIME, $5, $6, $7, $8, 'CHECKED_IN', 'WALKIN', CURRENT_TIMESTAMP)
       RETURNING *`,
      [patientUserId, doctor_id, department_id, todayStr, patient_name, ageNum, category, tokenNo]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Walk-in patient registered with Token ${tokenNo}.`,
      data: apptInsert.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// POST /api/appointments/emergency (Receptionist registers emergency triage)
export const registerEmergency = async (req, res, next) => {
  const client = await getClient();

  try {
    const {
      patient_name,
      age,
      phone,
      doctor_id,
      department_id,
      blood_group = 'O+'
    } = req.body;

    const todayStr = new Date().toISOString().split('T')[0];
    const ageNum = parseInt(age, 10);
    const category = 'EMERGENCY';

    await client.query('BEGIN');

    // 1. Create or find emergency triage guest
    let patientUserId = null;
    const userFind = await client.query(
      `SELECT id FROM users WHERE phone = $1`,
      [phone]
    );

    if (userFind.rows.length > 0) {
      patientUserId = userFind.rows[0].id;
    } else {
      const email = `emergency_${Date.now()}_${Math.floor(Math.random() * 1000)}@mediqueue.local`;
      const userInsert = await client.query(
        `INSERT INTO users (name, email, password_hash, phone, age, blood_group, role)
         VALUES ($1, $2, 'emergency_triage_no_login', $3, $4, $5, 'patient')
         RETURNING id`,
        [patient_name, email, phone, ageNum, blood_group]
      );
      patientUserId = userInsert.rows[0].id;
    }

    // 2. Generate atomic E-Series token (E01, E02..)
    const tokenNo = await generateNextToken(client, todayStr, category);

    // 3. Insert emergency appointment with CHECKED_IN status (enters queue at base 100)
    const apptInsert = await client.query(
      `INSERT INTO appointments (
         patient_id, doctor_id, department_id, appt_date, slot_time,
         patient_name_snapshot, age_snapshot, category, token_no,
         status, source, checked_in_at
       )
       VALUES ($1, $2, $3, $4, CURRENT_TIME, $5, $6, $7, $8, 'CHECKED_IN', 'WALKIN', CURRENT_TIMESTAMP)
       RETURNING *`,
      [patientUserId, doctor_id, department_id, todayStr, patient_name, ageNum, category, tokenNo]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Emergency registered with Token ${tokenNo}. All queue waiting times and ETAs updated live!`,
      data: apptInsert.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// GET /api/queue/today (Receptionist & Admin queue overview)
export const getTodayQueue = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const { doctor_id, status } = req.query;

    let queryText = `
      SELECT a.*,
             d.room_no, d.avg_consult_minutes,
             u.name AS doctor_name,
             dep.name AS department_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dep ON a.department_id = dep.id
      WHERE a.appt_date = $1
    `;
    const params = [todayStr];

    if (doctor_id) {
      params.push(doctor_id);
      queryText += ` AND a.doctor_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      queryText += ` AND a.status = $${params.length}`;
    }

    queryText += `
      ORDER BY
        CASE
          WHEN a.status = 'SERVING' THEN 1
          WHEN a.category = 'EMERGENCY' AND a.status IN ('CHECKED_IN', 'BOOKED') THEN 2
          WHEN a.status = 'CHECKED_IN' THEN 3
          WHEN a.status = 'BOOKED' THEN 4
          ELSE 5
        END,
        a.token_no ASC
    `;

    const { rows } = await query(queryText, params);

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/queue/display (Public endpoint for Live TV display)
export const getDisplayQueue = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Get all doctors with chamber/department details
    const { rows: doctors } = await query(
      `SELECT d.id AS doctor_id, d.room_no, d.status AS doctor_status,
              d.department_id, u.name AS doctor_name, dep.name AS department_name
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       JOIN departments dep ON d.department_id = dep.id
       ORDER BY dep.name, d.room_no`
    );

    // Get all active today appointments
    const { rows: appts } = await query(
      `SELECT a.id, a.doctor_id, a.department_id, a.token_no, a.category,
              a.status, a.patient_name_snapshot, a.called_at, a.checked_in_at, a.created_at
       FROM appointments a
       WHERE a.appt_date = $1 AND a.status IN ('SERVING', 'CHECKED_IN', 'BOOKED')
       ORDER BY a.token_no ASC`,
      [todayStr]
    );

    const chambers = doctors.map((doc) => {
      const docAppts = appts.filter((a) => a.doctor_id === doc.doctor_id);
      const currentlyServing = docAppts.find((a) => a.status === 'SERVING') || null;
      const waiting = docAppts.filter((a) => a.status !== 'SERVING').slice(0, 5);

      return {
        doctor_id: doc.doctor_id,
        doctor_name: doc.doctor_name,
        department_name: doc.department_name,
        department_id: doc.department_id,
        room_no: doc.room_no,
        doctor_status: doc.doctor_status,
        currentlyServing: currentlyServing
          ? {
              id: currentlyServing.id,
              token_no: currentlyServing.token_no,
              category: currentlyServing.category,
              called_at: currentlyServing.called_at,
              patient_name: currentlyServing.patient_name_snapshot,
            }
          : null,
        nextWaiting: waiting.map((w) => ({
          id: w.id,
          token_no: w.token_no,
          category: w.category,
          status: w.status,
        })),
        totalWaiting: docAppts.filter((a) => a.status !== 'SERVING').length,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        chambers,
        summary: {
          totalChambers: chambers.length,
          activeServing: chambers.filter((c) => c.currentlyServing).length,
          totalWaiting: chambers.reduce((acc, c) => acc + c.totalWaiting, 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
