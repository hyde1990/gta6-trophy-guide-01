import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, createProgressStore, serializeProgress, parseProgress } from '../app/js/store.js';

function fakeStorage(initial) {
  const bag = initial === undefined ? {} : { ...initial };
  return {
    getItem: (key) => (key in bag ? bag[key] : null),
    setItem: (key, value) => { bag[key] = String(value); },
    removeItem: (key) => { delete bag[key]; },
    _bag: bag,
  };
}

test('a fresh store starts empty and persists toggles', () => {
  const storage = fakeStorage();
  const store = createProgressStore(storage);
  assert.deepEqual([...store.load()], []);
  store.toggle(2);
  assert.equal(store.has(2), true);
  assert.equal(storage.getItem(STORAGE_KEY), '[2]');
  store.toggle(2);
  assert.equal(store.has(2), false);
  assert.equal(storage.getItem(STORAGE_KEY), '[]');
});

test('load reads a previously saved set and ignores unknown ids', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: '[2,15,999,"x"]' });
  const store = createProgressStore(storage);
  assert.deepEqual([...store.load()].sort((a, b) => a - b), [2, 15]);
});

test('export and import round-trip, and import rejects bad data', () => {
  const storage = fakeStorage();
  const store = createProgressStore(storage);
  store.save(new Set([2, 28, 14]));
  const text = store.exportText();
  assert.equal(text, '[2,14,28]');

  const other = createProgressStore(fakeStorage());
  const imported = other.importText(text);
  assert.deepEqual([...imported].sort((a, b) => a - b), [2, 14, 28]);
  assert.equal(other.has(28), true);

  assert.throws(() => other.importText('not json'), /invalid/i);
  assert.throws(() => other.importText('{"a":1}'), /invalid/i);
  assert.throws(() => other.importText('[0]'), /invalid/i);
  assert.throws(() => other.importText('[56]'), /invalid/i);
  assert.throws(() => other.importText('[2.5]'), /invalid/i);
  assert.throws(() => other.importText('["2"]'), /invalid/i);
  // a failed import must not wipe the good state
  assert.equal(other.has(28), true);
});

test('serialize and parse are inverses and sort ids', () => {
  assert.equal(serializeProgress(new Set([28, 2, 14])), '[2,14,28]');
  assert.deepEqual([...parseProgress('[2,14,28]')], [2, 14, 28]);
  assert.deepEqual([...parseProgress('[]')], []);
  assert.throws(() => parseProgress('[999]'), /invalid/i);
});

test('clear wipes the saved progress', () => {
  const storage = fakeStorage();
  const store = createProgressStore(storage);
  store.save(new Set([2, 3]));
  store.clear();
  assert.deepEqual([...store.load()], []);
  assert.equal(storage.getItem(STORAGE_KEY), '[]');
});
