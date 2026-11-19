// Leonida Ledger boot: load the trophy data, read the URL, wire the controls,
// and render the checklist, roadmap and missables views. Works fully offline:
// the only request the app makes is a relative fetch of its own data file.

import { loadTrophies, validateTrophies } from './data.js';
import { filterTrophies, overallProgress, gradeCounts } from './filters.js';
import { createProgressStore } from './store.js';
import { renderChecklist, renderDetailPane, renderProgress, renderRoadmap, renderMissables } from './views.js';

const OFFICIAL_FALLBACK = [];

function readParams() {
  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo');
  const demoIds = demo
    ? demo.split(',').map((s) => Number.parseInt(s.trim(), 10)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 55)
    : null;
  return {
    view: params.get('view') || 'checklist',
    trophy: Number.parseInt(params.get('trophy') || '', 10) || null,
    spoiler: params.get('spoiler') || null,
    grade: params.get('grade') || null,
    kind: params.get('kind') || null,
    query: params.get('q') || '',
    demoIds,
    compact: params.get('compact') === '1',
  };
}

function applyParamsToControls(params) {
  const queryEl = document.getElementById('search');
  const gradeEl = document.getElementById('grade');
  const kindEl = document.getElementById('kind');
  const spoilerEl = document.getElementById('spoiler');
  if (params.query) queryEl.value = params.query;
  if (params.grade) gradeEl.value = params.grade;
  if (params.kind) kindEl.value = params.kind;
  if (params.spoiler === 'on') spoilerEl.checked = true;
  if (params.spoiler === 'off') spoilerEl.checked = false;
}

export function currentState(trophies, store, demoIds) {
  const queryEl = document.getElementById('search');
  const gradeEl = document.getElementById('grade');
  const kindEl = document.getElementById('kind');
  const spoilerEl = document.getElementById('spoiler');
  const earnedOnlyEl = document.getElementById('earned-only');
  return {
    query: queryEl.value,
    grade: gradeEl.value,
    kind: kindEl.value,
    spoilerOn: spoilerEl.checked,
    onlyEarned: earnedOnlyEl.checked,
    earned: demoIds ? new Set(demoIds) : store.load(),
  };
}

async function boot() {
  const params = readParams();
  // Compact mode (used for screenshots) keeps the same app, just with a
  // slimmer header so more of the guide fits in one 1280x800 view.
  if (params.compact) document.body.classList.add('compact');
  const store = createProgressStore(window.localStorage);
  const doc = await loadTrophies();
  const trophies = doc.trophies || [];
  const problems = validateTrophies(doc, OFFICIAL_FALLBACK);
  if (problems.length > 0) {
    console.warn('trophy data problems:', problems);
  }

  const listEl = document.getElementById('rows');
  const detailEl = document.getElementById('detail');
  const progressEl = document.getElementById('progress');
  const roadmapEl = document.getElementById('roadmap');
  const missEl = document.getElementById('missables');
  const countEl = document.getElementById('shown-count');

  let selectedId = params.trophy && trophies.some((t) => t.id === params.trophy) ? params.trophy : null;
  let view = ['checklist', 'roadmap', 'missables'].includes(params.view) ? params.view : 'checklist';
  let demoEarned = params.demoIds ? new Set(params.demoIds) : null;

  function earnedSet() {
    return demoEarned || store.load();
  }

  function setView(next) {
    view = next;
    for (const tab of document.querySelectorAll('.tab')) {
      tab.classList.toggle('is-active', tab.dataset.view === view);
      tab.setAttribute('aria-selected', tab.dataset.view === view ? 'true' : 'false');
    }
    document.getElementById('view-checklist').hidden = view !== 'checklist';
    document.getElementById('view-roadmap').hidden = view !== 'roadmap';
    document.getElementById('view-missables').hidden = view !== 'missables';
    renderAll();
  }

  function renderAll() {
    const state = currentState(trophies, store, demoEarned ? [...demoEarned] : null);
    state.earned = earnedSet();
    const visible = filterTrophies(trophies, state);
    if (view === 'checklist') {
      renderChecklist(listEl, visible, state, callbacks);
      countEl.textContent = `${visible.length} of ${trophies.length} trophies shown`;
    }
    const selected = trophies.find((t) => t.id === selectedId) || null;
    renderDetailPane(detailEl, selected, selected ? earnedSet().has(selected.id) : false, callbacks, state.spoilerOn);
    const overall = overallProgress(trophies, earnedSet());
    renderProgress(progressEl, overall, gradeCounts(trophies, earnedSet()));
    renderRoadmap(roadmapEl, trophies, earnedSet(), callbacks);
    renderMissables(missEl, trophies, callbacks);
    document.title = `Leonida Ledger — ${overall.earned} of 55 GTA VI trophies earned`;
  }

  const callbacks = {
    onToggle(id, checked) {
      if (demoEarned) {
        if (checked) demoEarned.add(id);
        else demoEarned.delete(id);
      } else {
        const ids = store.load();
        if (checked) ids.add(id);
        else ids.delete(id);
        store.save(ids);
      }
      renderAll();
    },
    onSelect(id) {
      selectedId = id;
      renderAll();
      detailEl.scrollIntoView({ block: 'nearest' });
    },
  };

  for (const tab of document.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => setView(tab.dataset.view));
  }
  for (const id of ['search', 'grade', 'kind', 'spoiler', 'earned-only']) {
    document.getElementById(id).addEventListener('input', renderAll);
    document.getElementById(id).addEventListener('change', renderAll);
  }

  document.getElementById('export').addEventListener('click', () => {
    const blob = new Blob([store.exportText()], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'gta6-trophy-progress.json';
    link.click();
    URL.revokeObjectURL(link.href);
  });

  document.getElementById('import').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      store.importText(await file.text());
    } catch (error) {
      window.alert(`That progress file could not be imported: ${error.message}`);
    }
    event.target.value = '';
    renderAll();
  });

  document.getElementById('reset').addEventListener('click', () => {
    if (window.confirm('Clear all earned trophies in this browser?')) {
      store.clear();
      demoEarned = null;
      renderAll();
    }
  });

  applyParamsToControls(params);
  setView(view);
  if (selectedId) {
    const selected = trophies.find((t) => t.id === selectedId);
    if (selected) renderDetailPane(detailEl, selected, earnedSet().has(selected.id), callbacks, document.getElementById('spoiler').checked);
  }
}

boot().catch((error) => {
  const detailEl = document.getElementById('detail');
  if (detailEl) detailEl.textContent = `The trophy data could not be loaded: ${error.message}`;
  console.error(error);
});
