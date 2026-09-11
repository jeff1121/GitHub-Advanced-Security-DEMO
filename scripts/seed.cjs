const { Client } = require('pg');

const playerId = (index) => `11111111-1111-4111-8111-${String(index).padStart(12, '0')}`;
const roomId = (index) => `22222222-2222-4222-8222-${String(index).padStart(12, '0')}`;

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required; no database was changed. Use --container for Compose.');
    process.exitCode = 1;
    return;
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [208751]);
    for (let i = 1; i <= 20; i++) {
      await client.query(
        'INSERT INTO players (id, nickname, email, is_admin) VALUES ($1, $2, $3, false) ON CONFLICT (id) DO NOTHING',
        [playerId(i), `DemoPlayer${String(i).padStart(2, '0')}`, `demo${i}@example.invalid`]
      );
    }
    for (let i = 1; i <= 10; i++) {
      await client.query(
        `INSERT INTO rooms (id, code, name, host_player_id, status, draw_interval_ms)
         VALUES ($1, $2, $3, $4, 'finished', 1000) ON CONFLICT (id) DO NOTHING`,
        [roomId(i), `H${String(i).padStart(5, '0')}`, `Demo history ${i}`, playerId(i)]
      );
      await client.query(
        `INSERT INTO wins (room_id, player_id, line_type, score, verified)
         SELECT $1, $2, 'row', 100, true
         WHERE NOT EXISTS (SELECT 1 FROM wins WHERE room_id = $1 AND player_id = $2)`,
        [roomId(i), playerId(i)]
      );
    }
    const { rows } = await client.query(
      `SELECT
        (SELECT count(*)::int FROM players WHERE id = ANY($1::uuid[])) AS players,
        (SELECT count(*)::int FROM rooms WHERE id = ANY($2::uuid[])) AS rooms,
        (SELECT count(*)::int FROM wins WHERE room_id = ANY($2::uuid[])) AS wins`,
      [Array.from({ length: 20 }, (_, i) => playerId(i + 1)), Array.from({ length: 10 }, (_, i) => roomId(i + 1))]
    );
    if (rows[0].players !== 20 || rows[0].rooms !== 10 || rows[0].wins !== 10) {
      throw new Error('Seed verification failed; rolled back. Inspect existing demo-owned records.');
    }
    await client.query('COMMIT');
    console.log('Seed verified: 20 synthetic players, 10 finished games, 10 wins.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
seed().catch((error) => {
  console.error(`Seed failed (${error.code || error.name}). No credentials are logged.`);
  process.exitCode = 1;
});
