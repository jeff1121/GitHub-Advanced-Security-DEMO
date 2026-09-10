import fs from 'fs';
import path from 'path';
import { pool } from '../lib/db';

export const runMigrations = async (): Promise<void> => {
  const migrationsDir = path.resolve(__dirname, '../../db/migrations');
  console.log(`[Migrations] Reading migrations from: ${migrationsDir}`);

  if (!fs.existsSync(migrationsDir)) {
    console.error(`[Migrations] Directory not found: ${migrationsDir}`);
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`[Migrations] Found ${files.length} migration file(s)`);

  const client = await pool.connect();
  try {
    // Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    for (const file of files) {
      const checkRes = await client.query(
        'SELECT name FROM _migrations WHERE name = $1',
        [file]
      );

      if (checkRes.rows.length === 0) {
        console.log(`[Migrations] Applying: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[Migrations] Successfully applied: ${file}`);
      } else {
        console.log(`[Migrations] Already applied (skipping): ${file}`);
      }
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Migrations] Error executing migrations:', err);
    throw err;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('[Migrations] All migrations completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migrations] Failed:', err.message);
      process.exit(1);
    });
}
