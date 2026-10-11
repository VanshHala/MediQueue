import { query, getClient } from '../config/db.js';
import { z } from 'zod';
import { determineCategory, generateNextToken } from '../services/token.service.js';
import { calculateAppointmentEta } from '../services/eta.service.js';

function normalizeSlotTime(timeStr) {
  if (!timeStr) return '09:00';
  const trimmed = timeStr.trim();
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (match12) {
    let [_, hStr, mStr, meridiem] = match12;
    let h = parseInt(hStr, 10);
    const m = mStr;
    if (meridiem) {
      const isPM = meridiem.toUpperCase() === 'PM';
      if (isPM && h < 12) h += 12;
      if (!isPM && h === 12) h = 0;
    }
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  return trimmed;
}

export const bookAppointmentSchema = z.object({
  doctor_id: z.coerce.number().int().positive('Doctor is required'),
  department_id: z.coerce.number().int().positive().optional().nullable(),
  appt_date: z.string().optional(),
  appointment_date: z.string().optional(),
  slot_time: z.string().min(1, 'Slot time is required'),
  patient_name: z.string().optional(),
  age: z.coerce.number().int().min(1).max(125).optional(),
  complaint: z.string().optional(),
  symptoms: z.string().optional()
}).refine(data => data.appt_date || data.appointment_date, {
  message: 'Appointment date is required (appt_date or appointment_date)'
});

// POST /api/appointments (Patient booking)
export const bookAppointment = async (req, res, next) => {
  const client = await getClient();

  try {
    const userId = req.user.id;
    const {
      doctor_id,
      department_id,
      patient_name,
      age
    } = req.body;

    const appt_date = (req.body.appt_date || req.body.appointment_date || '').trim();
    const slot_time = normalizeSlotTime(req.body.slot_time);

    const patientNameSnapshot = (patient_name || req.user.name).trim();
    const ageSnapshot = age ? parseInt(age, 10) : parseInt(req.user.age, 10);

    // 1. Rule: Prevent past date or past time slot on today
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (appt_date < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book appointments for past dates.'
      });
    }

    if (appt_date === todayStr) {
      const [slotH, slotM] = slot_time.split(':').map(Number);
      const slotMinutes = (slotH || 0) * 60 + (slotM || 0);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (slotMinutes <= currentMinutes) {
        return res.status(400).json({
          success: false,
          message: 'The selected time slot has already passed for today.'
        });
      }
    }

    // 2. Rule: Patient cannot book two active appointments with the same doctor on the same day
    const duplicateCheck = await client.query(
      `SELECT id FROM appointments
       WHERE patient_id = $1 AND doctor_id = $2 AND appt_date = $3
         AND status IN ('BOOKED', 'CHECKED_IN', 'IN_CONSULTATION')`,
      [userId, doctor_id, appt_date]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active appointment scheduled with this doctor on the selected date.'
      });
    }

    // 3. Rule: Slot conflict check (is slot already taken?)
    const slotCheck = await client.query(
      `SELECT id FROM appointments
       WHERE doctor_id = $1 AND appt_date = $2 AND slot_time = $3
         AND status NOT IN ('CANCELLED', 'NO_SHOW')`,
      [doctor_id, appt_date, slot_time]
    );

    if (slotCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'The selected slot has just been taken by another patient. Please choose an alternative slot.'
      });
    }

    // 4. Resolve department_id from doctor if not provided
    let targetDeptId = department_id;
    if (!targetDeptId) {
      const docDeptRes = await client.query(
        `SELECT department_id FROM doctors WHERE id = $1`,
        [doctor_id]
      );
      if (docDeptRes.rows.length > 0) {
        targetDeptId = docDeptRes.rows[0].department_id;
      }
    }

    // 5. Automatic Senior Detection (Age >= 60 automatically joins SENIOR line)
    const category = determineCategory({ isEmergency: false, age: ageSnapshot });

    // 6. Database Transaction: Token generation & Appointment insertion
    await client.query('BEGIN');

    const tokenNo = await generateNextToken(client, appt_date, category);

    const insertQuery = `
      INSERT INTO appointments (
        patient_id, doctor_id, department_id, appt_date, slot_time,
        patient_name_snapshot, age_snapshot, category, token_no,
        status, source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'BOOKED', 'ONLINE')
      RETURNING *
    `;

    const insertRes = await client.query(insertQuery, [
      userId,
      doctor_id,
      targetDeptId,
      appt_date,
      slot_time,
      patientNameSnapshot,
      ageSnapshot,
      category,
      tokenNo
    ]);

    await client.query('COMMIT');

    const createdAppointment = insertRes.rows[0];

    // 7. Calculate initial ETA
    let etaData = null;
    try {
      etaData = await calculateAppointmentEta(createdAppointment.id);
    } catch (etaErr) {
      console.warn('Initial ETA calculation notice:', etaErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Appointment confirmed! Your token number is ${tokenNo}.`,
      token_number: tokenNo,
      token_no: tokenNo,
      data: {
        appointment: { ...createdAppointment, token_number: tokenNo, token_no: tokenNo },
        token_number: tokenNo,
        token_no: tokenNo,
        eta: etaData
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// GET /api/appointments/mine
export const getMyAppointments = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { rows } = await query(
      `SELECT a.*,
              d.room_no, d.avg_consult_minutes, d.status AS doctor_status,
              u.name AS doctor_name,
              dep.name AS department_name
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       LEFT JOIN departments dep ON a.department_id = dep.id
       WHERE a.patient_id = $1
       ORDER BY
         CASE
           WHEN a.status = 'SERVING' THEN 1
           WHEN a.status = 'CHECKED_IN' THEN 2
           WHEN a.status = 'BOOKED' THEN 3
           ELSE 4
         END,
         a.appt_date DESC,
         a.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/appointments/:id/eta
export const getAppointmentEta = async (req, res, next) => {
  try {
    const apptId = req.params.id;
    const etaData = await calculateAppointmentEta(apptId);

    res.status(200).json({
      success: true,
      data: etaData
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/appointments/:id/checkin
export const checkinAppointment = async (req, res, next) => {
  try {
    const apptId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify appointment exists
    const checkRes = await query(`SELECT * FROM appointments WHERE id = $1`, [apptId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const appt = checkRes.rows[0];

    // Patients can only check in their own appointment
    if (userRole === 'patient' && appt.patient_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to check in this appointment'
      });
    }

    if (appt.status !== 'BOOKED') {
      return res.status(400).json({
        success: false,
        message: `Appointment cannot be checked in because current status is ${appt.status}.`
      });
    }

    const { rows } = await query(
      `UPDATE appointments
       SET status = 'CHECKED_IN', checked_in_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [apptId]
    );

    const updatedAppt = rows[0];
    const eta = await calculateAppointmentEta(apptId);

    res.status(200).json({
      success: true,
      message: 'Checked in successfully! You are now in the active clinical queue.',
      data: {
        appointment: updatedAppt,
        eta
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/appointments/:id/cancel
export const cancelAppointment = async (req, res, next) => {
  try {
    const apptId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const checkRes = await query(`SELECT * FROM appointments WHERE id = $1`, [apptId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const appt = checkRes.rows[0];

    // Patients can only cancel their own appointment
    if (userRole === 'patient' && appt.patient_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this appointment'
      });
    }

    if (['DONE', 'CANCELLED', 'NO_SHOW'].includes(appt.status)) {
      return res.status(400).json({
        success: false,
        message: `Appointment is already marked as ${appt.status}.`
      });
    }

    const { rows } = await query(
      `UPDATE appointments
       SET status = 'CANCELLED'
       WHERE id = $1
       RETURNING *`,
      [apptId]
    );

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled. Token has been marked as inactive and is not reused.',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};
