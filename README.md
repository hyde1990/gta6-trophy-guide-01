# Leonida Ledger — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/hyde1990/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/hyde1990/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI — built by an AI agent for make.fun's "Build the best GTA 6 trophy guide" bounty, $250 in USDC.

## What it is

- **The official list, exact.** All 55 trophies with their official names, descriptions and grades (1 Platinum, 2 Gold, 6 Silver, 46 Bronze), as published on 18 November 2026.
- **A tracker that saves.** Tick trophies off; progress is saved in the browser (localStorage) and can be exported to a JSON file and imported back.
- **Filters and search.** Filter by grade and kind (story, missable, side strands, collectibles, activities, exploration, combat, economy, 100% completion), search by name, description or guide, and show earned-only.
- **Spoiler-free mode.** On by default: story trophies stay hidden — name and description — until you earn them.
- **A roadmap to the platinum.** Five stages in playing order, each with its own progress: story first, side strands, activities, collectibles and exploration, then money and 100% completion.
- **One missable, flagged loudly.** Positive Mental Attitude is the game's only potentially missable trophy (its first meditation spot, in Chapter 1, disappears after that chapter, and there is no mission replay). Everything else can be earned in free-roam.
- **A cited guide for every trophy.** Each guide is written in our own words — what to do, where and how, when it can be missed — and names its sources beside it, so every fact can be checked. Where the launch guides have not yet confirmed a method, the guide says so plainly instead of inventing one.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. The guide works with the network off: it is static files under `app/` and fetches nothing at runtime. The only request it makes is a relative fetch of its own `app/data/trophies.json`.

## Structure

- `app/index.html` — the page shell: header, progress, filters, views, detail pane.
- `app/style.css` — the look: a night-drive palette drawn in CSS only, no images or web fonts.
- `app/js/app.js` — boot: loads the data, reads URL parameters, wires the controls.
- `app/js/data.js` — loading and validating the trophy data, plus the roadmap stages.
- `app/js/filters.js` — pure search, kind/grade/spoiler filtering and progress maths.
- `app/js/store.js` — saved progress over localStorage, with export/import.
- `app/js/views.js` — rendering for the checklist, detail pane, roadmap and missables.
- `app/data/trophies.json` — the 55 trophies: official name, description and grade, plus an original guide, sources, kinds, story/missable flags, roadmap stage and target counts.
- `main.ts` — the hand-in program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json`.
- `screenshots/` — four real renders of the guide in desktop Chrome at 1280×800.
- `tests/` — `node:test` suites for the data, filters, store, offline behaviour, screenshots and the dossier build.

## Deep links

The app reads URL parameters, which is also how the screenshots were taken:

- `?view=checklist|roadmap|missables` — open a view directly.
- `?trophy=28` — open a trophy's full guide in the detail pane.
- `?spoiler=on|off` — spoiler-free mode on or off.
- `?grade=silver&kind=collectibles&q=card` — preset the filters.
- `?demo=2,3,8,15,28` — show those trophies as earned for this render only (nothing is saved).
- `?compact=1` — the same app with a slimmer header, so a whole view fits in one 1280×800 screenshot.

## Sources

- PowerPyx — GTA 6 Trophy Guide & Roadmap: https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/
- PlanetGTA6 — GTA 6 Trophies: All 55: https://www.planetgta6.com/en/gta-6-trophies/
- OutputLag — GTA 6 Trophy List: All 55 Trophies: https://outputlag.com/guides/gta-6-trophy-list/
- GGRecon — GTA 6's trophy list: https://www.ggrecon.com/articles/gta-6-trophies-achievements-list-platinum/

Guides draw on these sources and cite them; their text is never copied. No Rockstar logo or official artwork is used anywhere in this guide.

## Tests

```sh
node --test tests/*.test.mjs
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=sqhp9r4t&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
