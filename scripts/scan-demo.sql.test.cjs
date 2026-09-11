const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { Client } = require('pg');
const { createDirectory } = require('./scan-demo.cjs');

test('real PostgreSQL preserves substring search and treats injection as data', {
  skip: !process.env.DATABASE_URL
}, async (t) => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  t.after(() => db.end());
  await db.query('CREATE TEMP TABLE rooms (code text, name text)');
  await db.query('INSERT INTO rooms VALUES ($1, $2), ($3, $4)', ['A12345', 'Music bingo', 'B12345', 'Private room']);
  const server = http.createServer(createDirectory(db));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/rooms?q=`;
  const normal = await fetch(url + encodeURIComponent('music'));
  assert.deepEqual((await normal.json()).rooms, [{ code: 'A12345', name: 'Music bingo' }]);
  const attack = await fetch(url + encodeURIComponent("UNLIKELY%' OR 1=1 --"));
  assert.equal(attack.status, 200);
  assert.deepEqual((await attack.json()).rooms, [], 'Injection must not expose unrelated rooms');
});
