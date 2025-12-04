import 'dotenv/config';
import { Pool } from 'pg';

const MAX_RETRIES = 30;
const RETRY_INTERVAL = 1000;

async function waitForDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('✓ Database is ready');
      await pool.end();
      process.exit(0);
    } catch {
      console.log(`Waiting for database... (${i + 1}/${MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
    }
  }

  console.error('✗ Database connection failed after maximum retries');
  await pool.end();
  process.exit(1);
}

waitForDb();
