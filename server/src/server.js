import app from './app.js';
import { PORT } from './config/env.js';
import pool from './config/db.js';
import { initCronJobs } from './jobs/resetCounters.job.js';

const startServer = async () => {
  try {
    // Verify database connection on startup
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL Neon Database connected successfully.');

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
