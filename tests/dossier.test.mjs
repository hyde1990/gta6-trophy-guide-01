import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

test('main.ts builds a dossier deterministically', { timeout: 60000 }, () => {
  const outA = join(ROOT, 'out-test-a');
  const outB = join(ROOT, 'out-test-b');
  for (const out of [outA, outB]) {
    rmSync(out, { recursive: true, force: true });
    mkdirSync(out, { recursive: true });
    execFileSync('node', ['main.ts'], {
      cwd: ROOT,
      env: { ...process.env, MAKEFUN_OUTPUT_DIR: out },
      stdio: 'pipe',
    });
    const dossierPath = join(out, 'dossier.json');
    assert.ok(existsSync(dossierPath), 'dossier.json was not written');
    const dossier = JSON.parse(readFileSync(dossierPath, 'utf8'));
    assert.ok(dossier, 'dossier.json must parse');
    assert.ok(existsSync(join(out, 'app', 'index.html')), 'app/index.html missing from output');
    assert.ok(existsSync(join(out, 'app', 'data', 'trophies.json')), 'trophies.json missing from output');
  }
  const a = readFileSync(join(outA, 'dossier.json'));
  const b = readFileSync(join(outB, 'dossier.json'));
  assert.ok(a.equals(b), 'the two main.ts runs must write identical dossier bytes');
  assert.ok(a.length <= 1.5 * 1024 * 1024, `dossier is ${a.length} bytes, over the 1.5 MiB cap`);
  rmSync(outA, { recursive: true, force: true });
  rmSync(outB, { recursive: true, force: true });
});
