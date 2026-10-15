import app from './app.js';
import { PORT } from './config/env.js';
import pool from './config/db.js';
import { initCronJobs } from './jobs/resetCounters.job.js';

const connectWithRetry = async (retries = 5, delayMs = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`🔌 Connecting to PostgreSQL Neon Database (attempt ${i}/${retries})...`);
      await pool.query('SELECT 1');
      console.log('✅ PostgreSQL Neon Database connected successfully.');
      return;
    } catch (error) {
      console.warn(`⚠️ Database connection attempt ${i} failed: ${error.message}`);
      if (i === retries) throw error;
      console.log(`⏳ Neon compute may be waking up. Retrying in ${delayMs / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs = Math.min(delayMs * 1.5, 10000);
    }
  }
};

const startServer = async () => {
  try {
    // Verify database connection with retry on startup
    await connectWithRetry();

    // Initialize background cron jobs
    initCronJobs();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 MediQueue Server running on port ${PORT}`);
      console.log(`🏥 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to the database or start server:', error);
    process.exit(1);
  }
};

startServer();
