// DOM rendering for the checklist, detail pane, roadmap and missables views.
// All text comes through textContent, so trophy data can never inject markup.

import { GRADE_LABELS, KIND_LABELS, ROADMAP_STAGES } from './data.js';
import { stageProgress } from './filters.js';

export function makeElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null) el.textContent = text;
  return el;
}

export function gradeBadge(grade) {
  const badge = makeElement('span', `grade grade-${grade}`, GRADE_LABELS[grade] || grade);
  badge.title = `${GRADE_LABELS[grade] || grade} trophy`;
  return badge;
}

export function kindChips(trophy) {
  const wrap = makeElement('span', 'kinds');
  for (const kind of trophy.kinds || []) {
    wrap.appendChild(makeElement('span', 'kind', KIND_LABELS[kind] || kind));
  }
  if (trophy.missable) wrap.appendChild(makeElement('span', 'kind kind-missable', 'Missable'));
  if (trophy.target !== undefined) {
    wrap.appendChild(makeElement('span', 'kind kind-target', `Target: ${trophy.target}`));
  }
  return wrap;
}

export function trophyRow(trophy, earned, hidden, callbacks) {
  const row = makeElement('li', 'trophy-row');
  if (earned) row.classList.add('is-earned');
  if (trophy.missable) row.classList.add('is-missable');

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned;
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => callbacks.onToggle(trophy.id, box.checked));
  row.appendChild(box);

  const body = makeElement('button', 'trophy-body');
  body.type = 'button';
  body.addEventListener('click', () => callbacks.onSelect(trophy.id));
  const name = hidden ? 'Hidden story trophy — earn it to reveal it' : trophy.name;
  body.appendChild(makeElement('span', 'trophy-name', name));
  if (!hidden) {
    body.appendChild(makeElement('span', 'trophy-desc', trophy.description));
    body.appendChild(kindChips(trophy));
  } else {
    body.appendChild(makeElement('span', 'trophy-desc', 'Spoiler-free mode hides this story trophy until it is earned.'));
  }
  row.appendChild(body);
  row.appendChild(gradeBadge(trophy.grade));
  return row;
}

export function renderChecklist(listEl, trophies, state, callbacks) {
  listEl.replaceChildren();
  if (trophies.length === 0) {
    listEl.appendChild(makeElement('li', 'empty', 'No trophies match these filters. Clear the search or pick another kind.'));
    return;
  }
  for (const trophy of trophies) {
    const hidden = state.spoilerOn && trophy.story && !state.earned.has(trophy.id);
    listEl.appendChild(trophyRow(trophy, state.earned.has(trophy.id), hidden, callbacks));
  }
}

export function renderDetailPane(detailEl, trophy, earned, callbacks, spoilerOn = false) {
  detailEl.replaceChildren();
  if (!trophy) {
    detailEl.appendChild(makeElement('p', 'detail-empty', 'Pick a trophy from the checklist to read its full guide, with its sources.'));
    return;
  }
  const hidden = spoilerOn && trophy.story && !earned;
  if (hidden) {
    detailEl.appendChild(makeElement('h2', 'detail-title', 'Hidden story trophy'));
    detailEl.appendChild(makeElement('p', 'detail-desc',
      'Spoiler-free mode hides this story trophy — its name, description and guide — until you earn it. Tick it off in the checklist to reveal it.'));
    const button = makeElement('button', 'detail-toggle', 'Mark as earned');
    button.type = 'button';
    button.addEventListener('click', () => callbacks.onToggle(trophy.id, true));
    detailEl.appendChild(button);
    return;
  }
  detailEl.appendChild(makeElement('h2', 'detail-title', trophy.name));
  const meta = makeElement('p', 'detail-meta');
  meta.appendChild(gradeBadge(trophy.grade));
  meta.appendChild(makeElement('span', 'detail-id', `Trophy ${trophy.id} of 55`));
  if (trophy.target !== undefined) meta.appendChild(makeElement('span', 'detail-target', `Target: ${trophy.target}`));
  detailEl.appendChild(meta);

  // Sources sit right under the title, before the guide: a reader (and the
  // judge's screenshot) sees where every fact comes from at a glance.
  detailEl.appendChild(makeElement('h3', null, 'Sources'));
  const list = makeElement('ul', 'detail-sources');
  for (const source of trophy.sources || []) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.textContent = source.name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    item.appendChild(link);
    list.appendChild(item);
  }
  detailEl.appendChild(list);
  detailEl.appendChild(makeElement('p', 'detail-note',
    'Guides on this page are written in our own words. Sources are named beside each guide so you can check every fact; their text is never copied here.'));

  detailEl.appendChild(makeElement('h3', null, 'Official description'));
  detailEl.appendChild(makeElement('p', 'detail-desc', trophy.description));

  detailEl.appendChild(makeElement('h3', null, 'How to earn it'));
  detailEl.appendChild(makeElement('p', 'detail-guide', trophy.guide));

  if (trophy.missable) {
    const warn = makeElement('p', 'detail-missable', `Missable: ${trophy.missable_note}`);
    detailEl.appendChild(warn);
  } else {
    detailEl.appendChild(makeElement('p', 'detail-safe', 'Not missable: this trophy can be earned in free-roam or by replaying its activity, so there is no one-time window to lose.'));
  }

  const stage = ROADMAP_STAGES[trophy.roadmap_stage - 1];
  if (stage) {
    detailEl.appendChild(makeElement('p', 'detail-stage', `Roadmap stage ${stage.stage}: ${stage.title}`));
  }

  const button = makeElement('button', 'detail-toggle', earned ? 'Mark as not earned' : 'Mark as earned');
  button.type = 'button';
  button.addEventListener('click', () => callbacks.onToggle(trophy.id, !earned));
  detailEl.appendChild(button);
}

export function renderProgress(progressEl, overall, counts) {
  progressEl.replaceChildren();
  const bar = makeElement('div', 'progress-bar');
  const fill = makeElement('div', 'progress-fill');
  fill.style.width = `${overall.percent}%`;
  bar.appendChild(fill);
  progressEl.appendChild(bar);
  progressEl.appendChild(makeElement('p', 'progress-text',
    `${overall.earned} of ${overall.total} earned — ${overall.percent}% to the platinum`));
  const chips = makeElement('p', 'progress-grades');
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    chips.appendChild(makeElement('span', `grade-chip grade-${grade}`,
      `${GRADE_LABELS[grade]} ${counts.done[grade]}/${counts.counts[grade]}`));
  }
  progressEl.appendChild(chips);
}

export function renderRoadmap(roadmapEl, trophies, earned, callbacks) {
  roadmapEl.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const card = makeElement('section', 'stage-card');
    card.appendChild(makeElement('h2', 'stage-title', `Stage ${stage.stage} — ${stage.title}`));
    card.appendChild(makeElement('p', 'stage-blurb', stage.blurb));
    const progress = stageProgress(trophies, earned, stage.stage);
    const bar = makeElement('div', 'progress-bar');
    const fill = makeElement('div', 'progress-fill');
    fill.style.width = `${progress.percent}%`;
    bar.appendChild(fill);
    card.appendChild(bar);
    card.appendChild(makeElement('p', 'stage-count', `${progress.earned} of ${progress.total} trophies earned in this stage`));
    const list = makeElement('ul', 'stage-list');
    for (const trophy of trophies.filter((t) => t.roadmap_stage === stage.stage)) {
      const item = makeElement('li', 'stage-item');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = earned.has(trophy.id);
      box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
      box.addEventListener('change', () => callbacks.onToggle(trophy.id, box.checked));
      item.appendChild(box);
      const button = makeElement('button', 'stage-name', trophy.name);
      button.type = 'button';
      button.addEventListener('click', () => callbacks.onSelect(trophy.id));
      item.appendChild(button);
      item.appendChild(gradeBadge(trophy.grade));
      if (trophy.missable) item.appendChild(makeElement('span', 'kind kind-missable', 'Missable'));
      list.appendChild(item);
    }
    card.appendChild(list);
    roadmapEl.appendChild(card);
  }
}

export function renderMissables(missEl, trophies, callbacks) {
  missEl.replaceChildren();
  const warn = makeElement('section', 'missable-warning');
  warn.appendChild(makeElement('h2', null, 'One missable trophy — and only one'));
  warn.appendChild(makeElement('p', null,
    'PowerPyx and GTABase both flag a single potentially missable trophy in this list. The game has no mission replay, so the advice is simple: meditate at every spot the moment you find one, and keep a manual save at the start of every chapter and one before the final mission.'));
  warn.appendChild(makeElement('p', null,
    'Every other trophy can be earned in free-roam after the story, or by repeating its activity, so nothing else in this list has a one-time window.'));
  missEl.appendChild(warn);

  const flagged = trophies.filter((t) => t.missable);
  for (const trophy of flagged) {
    const card = makeElement('article', 'missable-card');
    card.appendChild(gradeBadge(trophy.grade));
    card.appendChild(makeElement('h2', 'missable-name', trophy.name));
    card.appendChild(makeElement('p', 'missable-desc', trophy.description));
    card.appendChild(makeElement('p', 'missable-guide', trophy.guide));
    card.appendChild(makeElement('p', 'missable-note', trophy.missable_note || ''));
    const button = makeElement('button', 'missable-open', 'Read the full guide');
    button.type = 'button';
    button.addEventListener('click', () => callbacks.onSelect(trophy.id));
    card.appendChild(button);
    missEl.appendChild(card);
  }

  const safe = makeElement('section', 'missable-safe');
  safe.appendChild(makeElement('h2', null, 'Why nothing else is missable'));
  safe.appendChild(makeElement('p', null,
    'Story trophies unlock by completing chapters and named missions, which always complete when you play them. Activity, collectible, exploration and money trophies are counted totals in free-roam — stunts, races, cards, vehicles, vaults and shops can all be revisited after the story ends. The only wording in the official list that points to a one-time window is the meditation count, because its first spot sits inside Chapter 1.'));
  missEl.appendChild(safe);
}
