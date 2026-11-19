// Leonida Ledger — the hand-in program for gta6-trophy-guide-01.
//
// The guide itself is plain static files under app/ (index.html, its modules,
// styles and data/trophies.json), and the screenshots are under screenshots/.
// This program copies both into the grader's output directory and writes
// dossier.json with the kit's vendored library, which is the summary the
// AI judge reads: the screenshots, the first load's files and bytes, and the
// source. Nothing here fetches anything and nothing is installed: Node 22
// standard library only.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// and serve the guide with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handInGuide() {
  // Fail fast with a plain message if the guide's entry page is missing,
  // instead of producing a dossier for an app that cannot open.
  if (!existsSync(join(repoRoot, 'app', 'index.html'))) {
    throw new Error('app/index.html is missing — the guide cannot open');
  }
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(join(outputDir, 'app'), { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  const shotsDir = join(repoRoot, 'screenshots');
  if (existsSync(shotsDir)) {
    cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
  }
  const shotCount = readdirSync(join(outputDir, 'screenshots')).length;
  if (shotCount < 3 || shotCount > 4) {
    throw new Error(`expected 3 or 4 screenshots, found ${shotCount}`);
  }

  // The scorer's caps, from the kit: at most 4 screenshots of 256 KiB each,
  // app/ at most 993 files and 48 MiB, and the dossier text at most 160 KiB.
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  console.log(`handed in ${shotCount} screenshots; dossier.json is ${dossier.length} bytes`);
}

handInGuide();
