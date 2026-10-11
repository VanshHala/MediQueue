import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
  console.log('🔄 Initializing MediQueue database...');

  try {
    const schemaPath = path.join(__dirname, '../../sql/schema.sql');
    const seedPath = path.join(__dirname, '../../sql/seed.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('⏳ Running schema.sql...');
    await pool.query(schemaSql);
    console.log('✅ schema.sql executed successfully.');

    console.log('⏳ Running seed.sql...');
    await pool.query(seedSql);
    console.log('✅ seed.sql executed successfully.');

    console.log('🎉 Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDb();
