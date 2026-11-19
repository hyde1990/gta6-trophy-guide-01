// Trophy data: loading the JSON file and validating it against the official list.
// The official list itself lives in the test fixture; this module only checks shape.

export const ROADMAP_STAGES = [
  { stage: 1, title: 'Story first — and the one missable', blurb: 'Play Chapters 1–5 and the named story missions. Meditate at every spot as you go: the first meditation, in Chapter 1, is the only missable trophy in the game, and there is no mission replay.' },
  { stage: 2, title: 'Side strands and strangers', blurb: 'Finish the final mission for each named character — Andy, Kenton, Billy, Randy and Tyrone — plus 8 stranger strands and the hunt for Bret.' },
  { stage: 3, title: 'Activities and challenges', blurb: 'Work through the counted activities: 250 stunts, gold in all 42 Shooting Range challenges, drone races, 20 race wins, fishing, arcade, bowling and 50 challenges.' },
  { stage: 4, title: 'Collectibles and exploration', blurb: 'Sweep Leonida: card sets, WAiNK locations, vehicles, areas and gang operations. Most of these are free-roam, so they can be done after the story.' },
  { stage: 5, title: 'Money, property and the platinum', blurb: 'Launder marked bills, spend across shops, buy the garages and register vehicles — then finish the 100% completion checklist for A Long Road and the platinum, Vice Got a Price!' },
];

export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  side: 'Side strands',
  collectibles: 'Collectibles',
  activities: 'Activities',
  exploration: 'Exploration',
  combat: 'Combat',
  economy: 'Economy',
  completion: '100% completion',
};

export const GRADE_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

export async function loadTrophies(fetcher) {
  const fetchFn = fetcher ?? globalThis.fetch;
  const response = await fetchFn('data/trophies.json');
  if (!response.ok) throw new Error(`could not load trophy data: ${response.status}`);
  return response.json();
}

export function validateTrophies(doc, official) {
  const errors = [];
  if (!doc || !Array.isArray(doc.trophies)) {
    return ['trophies.json must hold an object with a "trophies" array'];
  }
  if (doc.trophies.length !== 55) errors.push(`expected 55 trophies, found ${doc.trophies.length}`);
  const byName = new Map(doc.trophies.map((t) => [t.name, t]));
  for (const want of official) {
    const got = byName.get(want.name);
    if (!got) {
      errors.push(`missing trophy: ${want.name}`);
      continue;
    }
    if (got.description !== want.description) errors.push(`description differs: ${want.name}`);
    if (got.grade !== want.grade) errors.push(`grade differs: ${want.name}`);
  }
  for (const t of doc.trophies) {
    const label = t.name || `#${t.id}`;
    if (typeof t.guide !== 'string' || t.guide.trim().length < 120) {
      errors.push(`guide too short: ${label}`);
    } else if (t.guide.trim() === String(t.description).trim()) {
      errors.push(`guide repeats the description: ${label}`);
    }
    if (!Array.isArray(t.sources) || t.sources.length < 1) {
      errors.push(`no source cited: ${label}`);
    } else {
      for (const s of t.sources) {
        if (typeof s?.name !== 'string' || s.name.length < 4) errors.push(`source without a name: ${label}`);
        if (typeof s?.url !== 'string' || !s.url.startsWith('https://')) errors.push(`source without an https URL: ${label}`);
      }
    }
    if (!Array.isArray(t.kinds) || t.kinds.length < 1) errors.push(`no kind: ${label}`);
    if (!Number.isInteger(t.roadmap_stage) || t.roadmap_stage < 1 || t.roadmap_stage > 5) {
      errors.push(`roadmap_stage must be 1-5: ${label}`);
    }
    if (typeof t.story !== 'boolean') errors.push(`story must be a boolean: ${label}`);
    if (typeof t.missable !== 'boolean') errors.push(`missable must be a boolean: ${label}`);
    if (t.missable && (typeof t.missable_note !== 'string' || t.missable_note.trim().length < 20)) {
      errors.push(`missable trophy needs a note: ${label}`);
    }
    if (t.target !== undefined && (!Number.isFinite(t.target) || t.target <= 0)) {
      errors.push(`target must be a positive number: ${label}`);
    }
  }
  return errors;
}
