import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SHOTS = new URL('../screenshots/', import.meta.url).pathname;

// Read JPEG dimensions from the SOF0/SOF2 marker, no image library needed.
export function jpegDimensions(buffer) {
  let i = 2;
  while (i < buffer.length - 1) {
    if (buffer[i] !== 0xff) { i += 1; continue; }
    const marker = buffer[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const length = buffer.readUInt16BE(i + 2);
    if (marker === 0xc0 || marker === 0xc2) {
      return { height: buffer.readUInt16BE(i + 5), width: buffer.readUInt16BE(i + 7) };
    }
    i += 2 + length;
  }
  throw new Error('no SOF marker found');
}

test('exactly 4 screenshots, each a JPEG within the gate caps', () => {
  const files = readdirSync(SHOTS).filter((f) => !f.startsWith('.')).sort();
  assert.deepEqual(files, ['1-checklist.jpg', '2-roadmap.jpg', '3-missables.jpg', '4-detail.jpg']);
  for (const file of files) {
    const full = join(SHOTS, file);
    const size = statSync(full).size;
    assert.ok(size <= 256 * 1024, `${file} is ${size} bytes, over the 256 KiB cap`);
    assert.ok(size > 10 * 1024, `${file} is suspiciously small (${size} bytes)`);
    const buffer = readFileSync(full);
    assert.equal(buffer[0], 0xff, `${file} is not a JPEG`);
    assert.equal(buffer[1], 0xd8, `${file} is not a JPEG`);
    const { width, height } = jpegDimensions(buffer);
    assert.equal(width, 1280, `${file} width should be 1280, got ${width}`);
    assert.equal(height, 800, `${file} height should be 800, got ${height}`);
  }
});

test('shots.json describes the same 4 shots at 1280x800', () => {
  const shots = JSON.parse(readFileSync(new URL('../shots.json', import.meta.url), 'utf8'));
  assert.equal(shots.length, 4);
  for (const shot of shots) {
    assert.ok(typeof shot.file === 'string' && shot.file.endsWith('.jpg'));
    assert.ok(existsSync(join(SHOTS, shot.file)), `shots.json names a missing file: ${shot.file}`);
    assert.deepEqual(shot.viewport, { width: 1280, height: 800 });
  }
  assert.equal(shots[0].file, '1-checklist.jpg', 'the cover must be the checklist shot');
});
