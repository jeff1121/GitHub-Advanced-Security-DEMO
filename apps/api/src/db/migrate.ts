import fs from 'node:fs/promises';
import path from 'node:path';
import { transaction, pool } from '../lib/db';

export async function runMigrations(): Promise<void> {
  const directory = path.resolve(__dirname, '../../db/migrations');
  const files = (await fs.readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
  if (!files.length) throw new Error('No migrations found');
  await transaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock($1)', [208752]);
    await client.query('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
    for (const file of files) {
      const existing = await client.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
      if (existing.rowCount) continue;
      await client.query(await fs.readFile(path.join(directory, file), 'utf8'));
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
    }
  });
}

if (require.main === module) {
  runMigrations().then(() => console.log('Database migrations completed.')).catch(() => {
    console.error('Migration failed; changes rolled back. Check database configuration and existing records.');
    process.exitCode = 1;
  }).finally(() => pool.end());
}
