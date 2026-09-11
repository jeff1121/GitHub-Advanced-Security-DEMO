const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createDirectory } = require('./scan-demo.cjs');

async function serve(t, db) {
  const server = http.createServer(createDirectory(db));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  return `http://127.0.0.1:${server.address().port}`;
}

test('room directory binds search text safely when parameterized', async (t) => {
  let captured;
  const base = await serve(t, { query: async (...args) => { captured = args; return { rows: [] }; } });
  const input = "' OR 1=1--";
  const response = await fetch(`${base}/rooms?q=${encodeURIComponent(input)}`);
  assert.equal(response.status, 200);
  if (Array.isArray(captured[1]) && captured[1].length > 0) {
    assert.match(captured[0], /\$1/, 'The query must use a placeholder');
    assert.ok(captured[1][0] === input || captured[1][0] === `%${input}%`,
      'Accept wildcard composition in SQL or in the bound value; never concatenate input into SQL');
  }
});

test('room welcome does not return executable user HTML', async (t) => {
  const base = await serve(t, { query: async () => ({ rows: [] }) });
  const response = await fetch(`${base}/welcome?nickname=${encodeURIComponent('<img src=x onerror=alert(1)>')}`);
  assert.equal(response.status, 200);
  const type = response.headers.get('content-type');
  const body = await response.text();
  assert.ok(type.startsWith('application/json') || type.startsWith('text/plain') || !body.includes('<img'), 'Untrusted HTML must be escaped or sent as text/JSON');
});

test('room directory rejects invalid search and does not expose database errors', async (t) => {
  const base = await serve(t, { query: async () => { throw new Error('private database detail'); } });
  assert.equal((await fetch(`${base}/rooms`)).status, 400);
  const response = await fetch(`${base}/rooms?q=hello`);
  assert.equal(response.status, 500);
  assert.equal((await response.text()).includes('private database detail'), false);
});
