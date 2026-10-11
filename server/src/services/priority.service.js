/**
 * MediQueue Priority Scoring Service
 * 
 * Clinical Scoring Formula:
 * score = categoryWeight + (skip_count * 10) + (minutesWaited * 0.1)
 * 
 * Category Weights:
 * - EMERGENCY = 100 points
 * - SENIOR (Age >= 60) = 50 points
 * - GENERAL = 10 points
 * 
 * Aging Algorithm:
 * - Adds 0.1 points per minute waited to reward early arrivals.
 * - Adds 10 points per skip (when a later patient was called before this patient).
 * - Patients with skip_count >= 2 receive a "Priority Upgraded" badge.
 * 
 * Examples:
 * 1. General patient waited 30 mins with 0 skips: 10 + 0 + (30 * 0.1) = 13.0
 * 2. General patient waited 60 mins with 2 skips: 10 + 20 + (60 * 0.1) = 36.0 (Priority Upgraded)
 * 3. Senior patient just checked in (0 mins): 50 + 0 + 0 = 50.0
 * 4. Emergency patient: 100 + 0 + 0 = 100.0 (Always top of queue)
 */

export const calculateScore = (appointment, now = new Date()) => {
  if (!appointment) return 0;

  // 1. Base category weight
  let categoryWeight = 10;
  if (appointment.category === 'EMERGENCY') {
    categoryWeight = 100;
  } else if (appointment.category === 'SENIOR') {
    categoryWeight = 50;
  }

  // 2. Skip penalty boost (+10 points per skip)
  const skipBonus = (appointment.skip_count || 0) * 10;

  // 3. Time waited calculation (in minutes)
  let waitStartTime = appointment.checked_in_at ? new Date(appointment.checked_in_at) : null;
  
  // If not yet checked in, calculate from slot_time or creation
  if (!waitStartTime && appointment.slot_time) {
    const [hours, minutes] = appointment.slot_time.split(':').map(Number);
    waitStartTime = new Date(now);
    waitStartTime.setHours(hours, minutes, 0, 0);
  } else if (!waitStartTime) {
    waitStartTime = new Date(appointment.created_at);
  }

  const elapsedMs = Math.max(0, now.getTime() - waitStartTime.getTime());
  const minutesWaited = Math.floor(elapsedMs / (1000 * 60));
  const agingBonus = minutesWaited * 0.1;

  const totalScore = parseFloat((categoryWeight + skipBonus + agingBonus).toFixed(2));
  return totalScore;
};
