import { query } from '../config/db.js';
import { z } from 'zod';

export const doctorCreateSchema = z.object({
  user_id: z.coerce.number().int().positive(),
  department_id: z.coerce.number().int().positive(),
  room_no: z.string().min(1, 'Room number is required'),
  avg_consult_minutes: z.coerce.number().int().min(5).max(60).default(10),
  shift_start: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (HH:MM)').default('09:00:00'),
  shift_end: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (HH:MM)').default('17:00:00'),
  status: z.enum(['FREE', 'BUSY', 'OFFLINE']).default('OFFLINE')
});

export const doctorUpdateSchema = doctorCreateSchema.partial();

export const doctorStatusSchema = z.object({
  status: z.enum(['FREE', 'BUSY', 'OFFLINE'])
});

// Helper to convert HH:MM to minutes
const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Helper to convert minutes to HH:MM format
const minutesToTime = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// GET /api/doctors?department=
export const getDoctors = async (req, res, next) => {
  try {
    const { department } = req.query;
    let queryText = `
      SELECT d.id, d.user_id, d.room_no, d.avg_consult_minutes,
             d.shift_start, d.shift_end, d.status,
             u.name, u.email, u.phone,
             dep.id AS department_id, dep.name AS department_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dep ON d.department_id = dep.id
    `;
    const params = [];

    if (department) {
      if (!isNaN(department)) {
        params.push(department);
        queryText += ` WHERE dep.id = $1`;
      } else {
        params.push(`%${department.toLowerCase()}%`);
        queryText += ` WHERE LOWER(dep.name) LIKE $1`;
      }
    }

    queryText += ` ORDER BY dep.name ASC, u.name ASC`;

    const { rows } = await query(queryText, params);

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/doctors/:id/slots?date=YYYY-MM-DD
export const getDoctorSlots = async (req, res, next) => {
  try {
    const doctorId = req.params.id;
    const requestedDate = req.query.date || new Date().toISOString().split('T')[0];

    // 1. Fetch doctor schedule
    const docRes = await query(
      `SELECT d.id, d.room_no, d.avg_consult_minutes, d.shift_start, d.shift_end, d.status,
              u.name, dep.name AS department_name
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN departments dep ON d.department_id = dep.id
       WHERE d.id = $1`,
      [doctorId]
    );

    if (docRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const doctor = docRes.rows[0];
    const avgMinutes = doctor.avg_consult_minutes || 10;
    const startMinutes = timeToMinutes(doctor.shift_start.slice(0, 5));
    const endMinutes = timeToMinutes(doctor.shift_end.slice(0, 5));

    // 2. Fetch taken slots for this doctor on this date
    const apptsRes = await query(
      `SELECT slot_time
       FROM appointments
       WHERE doctor_id = $1 AND appt_date = $2
         AND status NOT IN ('CANCELLED', 'NO_SHOW')
         AND slot_time IS NOT NULL`,
      [doctorId, requestedDate]
    );

    const takenSlotTimes = new Set(
      apptsRes.rows.map((r) => r.slot_time.slice(0, 5))
    );

    // 3. Generate slots array
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday = requestedDate === todayStr;
    const currentMinutesNow = now.getHours() * 60 + now.getMinutes();

    const slots = [];
    for (let m = startMinutes; m < endMinutes; m += avgMinutes) {
      const timeStr = minutesToTime(m);
      const isTaken = takenSlotTimes.has(timeStr);
      const isPast = isToday && m <= currentMinutesNow;
      const isAvailable = !isTaken && !isPast;

      slots.push({
        time: timeStr,
        is_taken: isTaken,
        is_past: isPast,
        is_available: isAvailable
      });
    }

    res.status(200).json({
      success: true,
      data: {
        doctor: {
          id: doctor.id,
          name: doctor.name,
          room_no: doctor.room_no,
          department_name: doctor.department_name,
          status: doctor.status,
          avg_consult_minutes: doctor.avg_consult_minutes
        },
        date: requestedDate,
        total_slots: slots.length,
        available_count: slots.filter((s) => s.is_available).length,
        slots
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/doctors (admin)
export const createDoctor = async (req, res, next) => {
  try {
    const { user_id, department_id, room_no, avg_consult_minutes = 10, shift_start, shift_end, status = 'OFFLINE' } = req.body;

    const { rows } = await query(
      `INSERT INTO doctors (user_id, department_id, room_no, avg_consult_minutes, shift_start, shift_end, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, department_id, room_no, avg_consult_minutes, shift_start, shift_end, status]
    );

    // Also ensure user's role is set to 'doctor'
    await query(`UPDATE users SET role = 'doctor' WHERE id = $1`, [user_id]);

    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/doctors/:id (admin)
export const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { department_id, room_no, avg_consult_minutes, shift_start, shift_end, status } = req.body;

    const { rows } = await query(
      `UPDATE doctors
       SET department_id = COALESCE($1, department_id),
           room_no = COALESCE($2, room_no),
           avg_consult_minutes = COALESCE($3, avg_consult_minutes),
           shift_start = COALESCE($4, shift_start),
           shift_end = COALESCE($5, shift_end),
           status = COALESCE($6, status)
       WHERE id = $7
       RETURNING *`,
      [department_id, room_no, avg_consult_minutes, shift_start, shift_end, status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/doctors/me/status (doctor updates own status)
export const updateDoctorMyStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.body;

    const { rows } = await query(
      `UPDATE doctors
       SET status = $1
       WHERE user_id = $2
       RETURNING *`,
      [status, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not associated with this account'
      });
    }

    res.status(200).json({
      success: true,
      message: `Doctor status updated to ${status}`,
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};
