const http = require('node:http');
const express = require('express');
const { Pool } = require('pg');

function createDirectory(db) {
  const app = express();
  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  app.get('/rooms', async (req, res, next) => {
    if (typeof req.query.q !== 'string' || req.query.q.length > 80) {
      return res.status(400).json({ error: 'Supply q as a string up to 80 characters.' });
    }
    try {
      const result = await db.query(
        'SELECT code, name FROM rooms WHERE name ILIKE $1 ORDER BY code',
        [`%${req.query.q}%`]
      );
      res.json({ rooms: result.rows });
    } catch (error) {
      next(error);
    }
  });
  app.get('/welcome', (req, res) => {
    const nickname = typeof req.query.nickname === 'string' ? req.query.nickname.slice(0, 80) : 'Guest';
    res.type('text/plain').send(`Welcome, ${nickname}`);
  });
  app.use((_error, _req, res, _next) => res.status(500).json({ error: 'Directory unavailable' }));
  return app;
}

if (require.main === module) {
  if (!process.env.DATABASE_URL || process.env.DEMO_DIRECTORY_LOCAL !== 'true') {
    console.error('Requires DEMO_DIRECTORY_LOCAL=true and a disposable local DATABASE_URL.');
    process.exitCode = 1;
  } else {
    const url = new URL(process.env.DATABASE_URL);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
      throw new Error('Only disposable loopback databases are allowed.');
    }
    const db = new Pool({ connectionString: url.toString(), max: 2 });
    const server = http.createServer(createDirectory(db));
    server.listen(3999, '127.0.0.1', () => console.log('Room directory: http://127.0.0.1:3999'));
    const close = () => server.close(() => { void db.end(); });
    process.once('SIGINT', close);
    process.once('SIGTERM', close);
  }
}
module.exports = { createDirectory };
