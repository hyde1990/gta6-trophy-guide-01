// Pure filtering, search and progress maths for the trophy list.
// Nothing here touches the DOM or storage, so node:test can cover it fully.

export function normalizeText(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
}

export function trophyMatchesSearch(trophy, query) {
  const needle = normalizeText(query);
  if (needle === '') return true;
  const haystack = normalizeText(
    [trophy.name, trophy.description, trophy.guide, (trophy.kinds || []).join(' ')].join(' '),
  );
  return needle.split(' ').every((word) => haystack.includes(word));
}

export function isHiddenBySpoiler(trophy, spoilerOn, earnedIds) {
  if (!spoilerOn) return false;
  if (!trophy.story) return false;
  return !earnedIds.has(trophy.id);
}

export function trophyMatchesKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  if (kind === 'story') return trophy.story === true;
  if (kind === 'earned') return false; // earned is handled by the caller, not by kind
  return (trophy.kinds || []).includes(kind);
}

// Note: spoiler mode does NOT remove trophies from this list. A hidden story
// trophy still has a row — its name and description are masked by the view
// (see isHiddenBySpoiler and trophyRow) — so the checklist always shows all
// 55, and the spoiler setting hides the spoilers, not the trophies.
export function filterTrophies(trophies, state) {
  const query = state.query ?? '';
  const grade = state.grade ?? 'all';
  const kind = state.kind ?? 'all';
  const earned = state.earned ?? new Set();
  const onlyEarned = state.onlyEarned ?? false;
  return trophies.filter((trophy) => {
    if (onlyEarned && !earned.has(trophy.id)) return false;
    if (grade !== 'all' && trophy.grade !== grade) return false;
    if (!trophyMatchesKind(trophy, kind)) return false;
    if (!trophyMatchesSearch(trophy, query)) return false;
    return true;
  });
}

export function stageProgress(trophies, earnedIds, stage) {
  const inStage = trophies.filter((t) => t.roadmap_stage === stage);
  const done = inStage.filter((t) => earnedIds.has(t.id)).length;
  const total = inStage.length;
  return { total, earned: done, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function overallProgress(trophies, earnedIds) {
  const total = trophies.length;
  const done = trophies.filter((t) => earnedIds.has(t.id)).length;
  return { total, earned: done, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function gradeCounts(trophies, earnedIds) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const done = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) {
    counts[t.grade] += 1;
    if (earnedIds.has(t.id)) done[t.grade] += 1;
  }
  return { counts, done };
}
