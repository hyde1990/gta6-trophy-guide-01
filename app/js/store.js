// Saved progress: a tiny store over any storage object with getItem/setItem.
// In the browser the storage is window.localStorage; in tests it is a fake.
// Progress is a sorted JSON array of trophy ids, nothing else.

export const STORAGE_KEY = 'gta6-trophy-guide-v1';
export const MAX_TROPHY_ID = 55;

export function serializeProgress(ids) {
  const sorted = [...ids].filter((id) => Number.isInteger(id)).sort((a, b) => a - b);
  return JSON.stringify(sorted);
}

export function parseProgress(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('invalid progress file: not JSON');
  }
  if (!Array.isArray(parsed)) throw new Error('invalid progress file: expected a list of trophy ids');
  const out = new Set();
  for (const id of parsed) {
    if (!Number.isInteger(id) || id < 1 || id > MAX_TROPHY_ID) {
      throw new Error(`invalid progress file: bad trophy id ${String(id)}`);
    }
    out.add(id);
  }
  return out;
}

export function createProgressStore(storage) {
  function load() {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null || raw === undefined || raw === '') return new Set();
    try {
      return parseProgress(raw);
    } catch {
      // A hand-edited or older save may hold ids outside the list: keep the
      // valid ones instead of wiping the whole save. Imports stay strict.
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return new Set();
        return new Set(parsed.filter((id) => Number.isInteger(id) && id >= 1 && id <= MAX_TROPHY_ID));
      } catch {
        return new Set();
      }
    }
  }

  function save(ids) {
    storage.setItem(STORAGE_KEY, serializeProgress(ids));
  }

  return {
    load,
    save,
    has(id) {
      return load().has(id);
    },
    toggle(id) {
      const ids = load();
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      save(ids);
      return ids;
    },
    clear() {
      save(new Set());
    },
    exportText() {
      return serializeProgress(load());
    },
    importText(text) {
      const ids = parseProgress(text);
      save(ids);
      return ids;
    },
  };
}
