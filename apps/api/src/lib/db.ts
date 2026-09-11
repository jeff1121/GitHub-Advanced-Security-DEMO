import { Pool, PoolClient, QueryResultRow } from 'pg';
import { config } from '../config';

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 3000,
  statement_timeout: 5000
});
pool.on('error', () => console.error('PostgreSQL idle connection failed.'));

export function query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]) {
  return pool.query<T>(text, values);
}

export async function transaction<T>(run: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await run(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
