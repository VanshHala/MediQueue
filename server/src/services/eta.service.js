import { query } from '../config/db.js';
import { calculateScore } from './priority.service.js';

/**
 * Recalculate Live ETA and "Report by" time for an appointment
 * 
 * Logic:
 * 1. Find all waiting appointments (status IN ('BOOKED', 'CHECKED_IN')) for the same doctor and date.
 * 2. Calculate dynamic priority score for each appointment.
 * 3. Count patients ahead (those with a strictly higher score than target appointment).
 * 4. Find currently SERVING patient for this doctor and compute remaining consultation minutes.
 * 5. estimatedWaitMinutes = remainingCurrent + (patientsAhead * avg_consult_minutes)
 * 6. estimatedCallTime = now + estimatedWaitMinutes
 * 7. reportByTime = max(now, estimatedCallTime - 15 minutes)
 */
export const calculateAppointmentEta = async (appointmentId) => {
  const now = new Date();

  // 1. Fetch the target appointment and doctor info
  const apptRes = await query(
    `SELECT a.*, d.avg_consult_minutes, d.room_no, d.status AS doctor_status,
            u.name AS doctor_name, dep.name AS department_name
     FROM appointments a
     JOIN doctors d ON a.doctor_id = d.id
     JOIN users u ON d.user_id = u.id
     LEFT JOIN departments dep ON a.department_id = dep.id
     WHERE a.id = $1`,
    [appointmentId]
  );

  if (apptRes.rows.length === 0) {
    throw new Error('Appointment not found');
  }

  const appointment = apptRes.rows[0];
  const avgConsultMinutes = appointment.avg_consult_minutes || 10;
  const targetScore = calculateScore(appointment, now);

  // If appointment is already completed, serving, or cancelled, return immediate status
  if (['SERVING', 'DONE', 'NO_SHOW', 'CANCELLED'].includes(appointment.status)) {
    return {
      appointmentId: appointment.id,
      tokenNo: appointment.token_no,
      status: appointment.status,
      category: appointment.category,
      score: targetScore,
      patientsAhead: 0,
      remainingCurrentMinutes: 0,
      estimatedWaitMinutes: 0,
      estimatedCallTime: now.toISOString(),
      reportByTime: now.toISOString(),
      servingNow: appointment.status === 'SERVING',
      doctor: {
        name: appointment.doctor_name,
        room: appointment.room_no,
        status: appointment.doctor_status,
        department: appointment.department_name
      }
    };
  }

  // 2. Fetch currently serving patient for this doctor today
  const servingRes = await query(
    `SELECT id, token_no, patient_name_snapshot, called_at
     FROM appointments
     WHERE doctor_id = $1 AND appt_date = $2 AND status = 'SERVING'
     ORDER BY called_at DESC LIMIT 1`,
    [appointment.doctor_id, appointment.appt_date]
  );

  let remainingCurrentMinutes = 0;
  let currentServingPatient = null;

  if (servingRes.rows.length > 0) {
    const serving = servingRes.rows[0];
    currentServingPatient = {
      tokenNo: serving.token_no,
      patientName: serving.patient_name_snapshot
    };

    if (serving.called_at) {
      const elapsedMs = Math.max(0, now.getTime() - new Date(serving.called_at).getTime());
      const elapsedMins = Math.floor(elapsedMs / (1000 * 60));
      remainingCurrentMinutes = Math.max(0, avgConsultMinutes - elapsedMins);
    } else {
      remainingCurrentMinutes = avgConsultMinutes;
    }
  }

  // 3. Fetch all other waiting appointments for this doctor today
  const waitingRes = await query(
    `SELECT id, token_no, category, skip_count, checked_in_at, slot_time, created_at, status
     FROM appointments
     WHERE doctor_id = $1 AND appt_date = $2 AND status IN ('BOOKED', 'CHECKED_IN') AND id != $3`,
    [appointment.doctor_id, appointment.appt_date, appointment.id]
  );

  let patientsAhead = 0;
  waitingRes.rows.forEach((otherAppt) => {
    const otherScore = calculateScore(otherAppt, now);
    if (otherScore > targetScore) {
      patientsAhead++;
    } else if (otherScore === targetScore) {
      // Tie-breaker: earlier creation or check-in goes first
      const thisTime = new Date(appointment.checked_in_at || appointment.created_at).getTime();
      const otherTime = new Date(otherAppt.checked_in_at || otherAppt.created_at).getTime();
      if (otherTime < thisTime) {
        patientsAhead++;
      }
    }
  });

  // 4. Calculate total estimated wait and "report by" time
  const estimatedWaitMinutes = remainingCurrentMinutes + (patientsAhead * avgConsultMinutes);
  const estimatedCallTime = new Date(now.getTime() + estimatedWaitMinutes * 60 * 1000);
  
  // Report by time: 15 minutes before call time, but never in the past
  const fifteenMinsBeforeMs = estimatedCallTime.getTime() - (15 * 60 * 1000);
  const reportByTime = new Date(Math.max(now.getTime(), fifteenMinsBeforeMs));

  return {
    appointmentId: appointment.id,
    tokenNo: appointment.token_no,
    status: appointment.status,
    category: appointment.category,
    skipCount: appointment.skip_count,
    isPriorityUpgraded: appointment.skip_count >= 2,
    score: targetScore,
    patientsAhead,
    remainingCurrentMinutes,
    estimatedWaitMinutes,
    estimatedCallTime: estimatedCallTime.toISOString(),
    reportByTime: reportByTime.toISOString(),
    currentServingPatient,
    doctor: {
      name: appointment.doctor_name,
      room: appointment.room_no,
      status: appointment.doctor_status,
      department: appointment.department_name
    }
  };
};
