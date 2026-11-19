import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText,
  trophyMatchesSearch,
  isHiddenBySpoiler,
  filterTrophies,
  stageProgress,
  overallProgress,
} from '../app/js/filters.js';

const SAMPLE = [
  { id: 2, name: 'Just Like Paradise', description: 'Complete Gone Fishing.', grade: 'bronze',
    guide: 'Finish the opening mission.', kinds: ['story'], story: true, missable: false, roadmap_stage: 1 },
  { id: 15, name: 'Cunning Stunts', description: 'Complete 250 Stunts.', grade: 'silver',
    guide: 'Pull off 250 stunts across Leonida.', kinds: ['activities'], story: false, missable: false, roadmap_stage: 3 },
  { id: 28, name: 'Positive Mental Attitude', description: 'Meditate at every spot across Leonida.', grade: 'bronze',
    guide: 'Meditate at all 18 spots; the first one in Chapter 1 can be missed.', kinds: ['activities', 'collectibles'],
    story: false, missable: true, roadmap_stage: 1 },
  { id: 30, name: "Don't Touch My Deck", description: 'Complete 3 Collectible Card sets.', grade: 'silver',
    guide: 'Finish three card sets.', kinds: ['collectibles'], story: false, missable: false, roadmap_stage: 4 },
];

test('normalizeText folds case, curly quotes and dashes', () => {
  assert.equal(normalizeText('  Let’s   Go—Bowling '), 'let\'s go-bowling');
  assert.equal(normalizeText(''), '');
});

test('search matches name, description and guide, case-insensitively', () => {
  assert.equal(trophyMatchesSearch(SAMPLE[1], 'stunt'), true);
  assert.equal(trophyMatchesSearch(SAMPLE[1], 'STUNTS'), true);
  assert.equal(trophyMatchesSearch(SAMPLE[1], 'meditate'), false);
  assert.equal(trophyMatchesSearch(SAMPLE[2], 'chapter 1'), true);
  assert.equal(trophyMatchesSearch(SAMPLE[0], ''), true);
  assert.equal(trophyMatchesSearch(SAMPLE[0], '   '), true);
});

test('spoiler hides an unearned story trophy and reveals it once earned', () => {
  assert.equal(isHiddenBySpoiler(SAMPLE[0], true, new Set()), true);
  assert.equal(isHiddenBySpoiler(SAMPLE[0], true, new Set([2])), false);
  assert.equal(isHiddenBySpoiler(SAMPLE[0], false, new Set()), false);
  assert.equal(isHiddenBySpoiler(SAMPLE[1], true, new Set()), false);
});

test('filterTrophies combines grade, kind, search and spoiler', () => {
  const all = filterTrophies(SAMPLE, { query: '', grade: 'all', kind: 'all', spoilerOn: false, earned: new Set() });
  assert.equal(all.length, 4);
  assert.equal(filterTrophies(SAMPLE, { query: '', grade: 'silver', kind: 'all', spoilerOn: false, earned: new Set() }).length, 2);
  assert.equal(filterTrophies(SAMPLE, { query: '', grade: 'all', kind: 'missable', spoilerOn: false, earned: new Set() }).map((t) => t.id).join(','), '28');
  assert.equal(filterTrophies(SAMPLE, { query: '', grade: 'all', kind: 'collectibles', spoilerOn: false, earned: new Set() }).map((t) => t.id).join(','), '28,30');
  assert.equal(filterTrophies(SAMPLE, { query: 'card', grade: 'all', kind: 'all', spoilerOn: false, earned: new Set() }).map((t) => t.id).join(','), '30');
  // Spoiler mode masks a story trophy's text in the view but never removes
  // its row: the checklist always shows all 55 trophies.
  const spoiler = filterTrophies(SAMPLE, { query: '', grade: 'all', kind: 'all', spoilerOn: true, earned: new Set() });
  assert.equal(spoiler.some((t) => t.id === 2), true);
  assert.equal(spoiler.length, 4);
});

test('stage and overall progress count earned ids', () => {
  const earned = new Set([2, 28]);
  assert.deepEqual(stageProgress(SAMPLE, earned, 1), { total: 2, earned: 2, percent: 100 });
  assert.deepEqual(stageProgress(SAMPLE, earned, 3), { total: 1, earned: 0, percent: 0 });
  assert.deepEqual(overallProgress(SAMPLE, earned), { total: 4, earned: 2, percent: 50 });
  assert.deepEqual(overallProgress(SAMPLE, new Set()), { total: 4, earned: 0, percent: 0 });
});
