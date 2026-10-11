import cron from 'node-cron';
import { query } from '../config/db.js';

/**
 * Daily midnight maintenance job
 * Runs at 00:00 (midnight) every day
 */
export const runDailyMidnightReset = async () => {
  console.log('[CRON] Running daily midnight queue and counter reset...');
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 1. Mark leftover unserved appointments from yesterday as EXPIRED
    const expiredRes = await query(
      `UPDATE appointments
       SET status = 'NO_SHOW'
       WHERE appt_date <= $1 AND status IN ('BOOKED', 'CHECKED_IN')
       RETURNING id`,
      [yesterdayStr]
    );

    // 2. Reset all doctors back to FREE status for the new day
    await query(`UPDATE doctors SET status = 'FREE' WHERE status = 'BUSY'`);

    console.log(
      `[CRON] Reset complete. Expired ${expiredRes.rowCount} unresolved tokens. All doctors set to FREE.`
    );
  } catch (error) {
    console.error('[CRON] Error during daily reset:', error);
  }
};

export const initCronJobs = () => {
  // Schedule at 00:00 every midnight: '0 0 * * *'
  cron.schedule('0 0 * * *', () => {
    runDailyMidnightReset();
  });
  console.log('[CRON] Midnight reset scheduler registered (0 0 * * *)');
};
