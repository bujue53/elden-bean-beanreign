const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const net = require('node:net');
const http = require('node:http');
const path = require('node:path');

function launch(port) {
  const child = spawn(process.execPath, ['server.js', '--no-open'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port) },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const ready = new Promise((resolve, reject) => {
    let output = '';
    child.stderr.on('data', chunk => output += chunk);
    const timeout = setTimeout(() => reject(new Error('Server startup timed out: ' + output)), 10000);
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/Server running at http:\/\/localhost:(\d+)/);
      if (match) { clearTimeout(timeout); resolve(Number(match[1])); }
    });
    child.once('error', err => { clearTimeout(timeout); reject(err); });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error('Server exited: ' + code + '\n' + output)); });
  });
  return { child, ready };
}

function request(port, url) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port, path: url }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on('error', reject);
  });
}

test('serves game modules and rejects missing, malformed and hidden paths', async t => {
  const { child, ready } = launch(0);
  t.after(() => child.kill());
  const port = await ready;
  const home = await request(port, '/');
  assert.equal(home.status, 200);
  assert.match(home.body, /ELDEN BEAN/);
  for (const file of ['/js/game.js', '/js/characters.js', '/js/audio.js', '/js/textures.js', '/lib/three.module.js', '/lib/three.core.js']) {
    const response = await request(port, file);
    assert.equal(response.status, 200, file);
    assert.match(response.headers['content-type'], /javascript/, file);
  }
  assert.equal((await request(port, '/css/style.css')).status, 200);
  assert.equal((await request(port, '/missing-file')).status, 404);
  assert.equal((await request(port, '/%ZZ')).status, 400);
  assert.equal((await request(port, '/.git/config')).status, 403);
  assert.equal((await request(port, '/%2e%2e%5cprivate.txt')).status, 403);
});

test('skips two consecutive occupied ports', async t => {
  let first, second, third, port;
  for (let attempt = 0; attempt < 20; attempt++) {
    first = net.createServer();
    first.listen(0, '127.0.0.1');
    await once(first, 'listening');
    port = first.address().port;
    second = net.createServer();
    try {
      second.listen(port + 1, '127.0.0.1');
      await once(second, 'listening');
      third = net.createServer();
      third.listen(port + 2, '127.0.0.1');
      await once(third, 'listening');
      await new Promise(resolve => third.close(resolve));
      break;
    } catch {
      await new Promise(resolve => first.close(resolve));
      if (second.listening) await new Promise(resolve => second.close(resolve));
      port = null;
    }
  }
  assert.ok(port, 'Could not reserve consecutive ports');
  t.after(() => { first.close(); second.close(); });
  const { child, ready } = launch(port);
  t.after(() => child.kill());
  const actual = await ready;
  assert.ok(actual >= port + 2 && actual <= port + 20);
  assert.equal((await request(actual, '/')).status, 200);
});
