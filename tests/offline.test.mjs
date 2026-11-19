import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const APP = new URL('../app/', import.meta.url).pathname;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

test('the app makes no network request: no remote script, style, fetch or import', () => {
  const bad = [];
  const patterns = [
    [/<script[^>]+src=["']https?:/i, 'remote <script src>'],
    [/<script[^>]+src=["']\/\//i, 'protocol-relative <script src>'],
    [/<link[^>]+href=["']https?:/i, 'remote <link href>'],
    [/<img[^>]+src=["']https?:/i, 'remote <img src>'],
    [/@import\s+["']https?:/i, 'remote @import'],
    [/url\(\s*["']?https?:/i, 'remote url()'],
    [/fetch\(\s*["']https?:/i, 'remote fetch()'],
    [/fetch\(\s*`https?:/i, 'remote fetch() template'],
    [/import\(\s*["']https?:/i, 'remote dynamic import()'],
    [/from\s+["']https?:/i, 'remote static import'],
    [/new\s+WebSocket\(\s*["']wss?:/i, 'websocket'],
    [/\.src\s*=\s*["']https?:/i, 'script src assignment'],
  ];
  for (const file of walk(APP)) {
    const text = readFileSync(file, 'utf8');
    for (const [pattern, label] of patterns) {
      if (pattern.test(text)) bad.push(`${file}: ${label}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('every local script, stylesheet and data file the app loads exists under app/', () => {
  const html = readFileSync(join(APP, 'index.html'), 'utf8');
  const refs = [
    ...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi),
    ...html.matchAll(/<link[^>]+href=["']([^"']+)["']/gi),
  ].map((m) => m[1]);
  assert.ok(refs.length >= 2, 'index.html should load a stylesheet and a script');
  for (const ref of refs) {
    assert.ok(!ref.startsWith('http'), `remote reference: ${ref}`);
    assert.ok(existsSync(join(APP, ref)), `missing local file: ${ref}`);
  }
  assert.ok(existsSync(join(APP, 'data/trophies.json')));
});

test('no file under app/ is a symlink or oversized for the gate', () => {
  for (const file of walk(APP)) {
    const st = statSync(file);
    assert.ok(!st.isSymbolicLink(), `${file} is a symlink`);
    assert.ok(st.size <= 2 * 1024 * 1024, `${file} exceeds 2 MiB`);
  }
  assert.ok(statSync(join(APP, 'index.html')).size <= 1024 * 1024, 'index.html exceeds 1 MiB');
  assert.ok(extname(join(APP, 'index.html')) === '.html');
});
