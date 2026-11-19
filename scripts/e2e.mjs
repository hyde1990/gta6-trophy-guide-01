// End-to-end check of the guide in headless Chromium, over CDP:
// the checklist renders all 55 rows with story trophies masked, ticking a
// trophy saves it and moves the progress bar, the roadmap has 5 stages,
// and the missables view names the one missable trophy.
//
// Usage: node scripts/e2e.mjs  (exit 0 when every check passes)

import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ChromeTab, launchChrome, waitForHttp } from './cdp.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const serverPort = 8081;
const chromePort = 9224;

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  const server = spawn('node', ['serve.ts', '--port', String(serverPort)], { cwd: root, stdio: 'ignore' });
  const chrome = launchChrome(chromePort, join(root, '.chrome-e2e'));
  try {
    await waitForHttp(`http://127.0.0.1:${serverPort}/`);
    await waitForHttp(`http://127.0.0.1:${chromePort}/json/version`);
    const tab = await ChromeTab.open(chromePort, `http://localhost:${serverPort}/`);

    const rows = await tab.evaluate(`document.querySelectorAll('#rows .trophy-row').length`);
    check('checklist renders 55 rows', rows === 55, `${rows} rows`);

    const masked = await tab.evaluate(
      `[...document.querySelectorAll('.trophy-name')].filter((el) => el.textContent.includes('Hidden story trophy')).length`);
    check('spoiler mode masks 12 story trophies', masked === 12, `${masked} masked`);

    const title = await tab.evaluate(`document.querySelector('.hero h1').textContent`);
    check('header renders', title === 'Leonida Ledger', title);

    await tab.evaluate(`document.querySelector('#rows .trophy-row input').click()`);
    const saved = await tab.evaluate(`JSON.parse(localStorage.getItem('gta6-trophy-guide-v1') || '[]').length`);
    check('ticking a trophy saves progress', saved === 1, `${saved} saved`);
    const progress = await tab.evaluate(`document.querySelector('.progress-text').textContent`);
    check('progress bar moves to 1 of 55', progress.includes('1 of 55'), progress);

    await tab.evaluate(`document.querySelector('[data-view="roadmap"]').click()`);
    const stages = await tab.evaluate(`document.querySelectorAll('.stage-card').length`);
    check('roadmap has 5 stages', stages === 5, `${stages} stages`);
    const stageItems = await tab.evaluate(`document.querySelectorAll('.stage-item').length`);
    check('roadmap lists all 55 trophies', stageItems === 55, `${stageItems} items`);

    await tab.evaluate(`document.querySelector('[data-view="missables"]').click()`);
    const missText = await tab.evaluate(`document.querySelector('#missables').textContent`);
    check('missables view names Positive Mental Attitude', missText.includes('Positive Mental Attitude'));
    check('missables view says only one is missable', missText.includes('only one'));

    await tab.evaluate(`document.querySelector('[data-view="checklist"]').click()`);
    await tab.evaluate(`document.querySelector('#kind').value = 'missable'; document.querySelector('#kind').dispatchEvent(new Event('change'))`);
    const missRows = await tab.evaluate(`document.querySelectorAll('#rows .trophy-row').length`);
    check('missable filter shows 1 trophy', missRows === 1, `${missRows} rows`);

    tab.close();
  } finally {
    chrome.kill();
    server.kill();
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(`${checks.length - failed}/${checks.length} end-to-end checks passed`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
