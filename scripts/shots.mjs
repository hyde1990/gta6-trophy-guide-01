// Take the four screenshots in shots.json: real renders of the guide in
// headless Chromium at 1280x800, saved as JPEGs under screenshots/.
// Starts the guide's own server and a headless Chrome, then stops both.
//
// Usage: node scripts/shots.mjs

import { spawn } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { CHROME, ChromeTab, launchChrome, waitForHttp } from './cdp.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const shots = JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8'));
const serverPort = 8080;
const chromePort = 9223;

async function main() {
  const server = spawn('node', ['serve.ts', '--port', String(serverPort)], {
    cwd: root,
    stdio: 'ignore',
  });
  const chrome = launchChrome(chromePort, join(root, '.chrome-shots'));
  try {
    await waitForHttp(`http://127.0.0.1:${serverPort}/`);
    await waitForHttp(`http://127.0.0.1:${chromePort}/json/version`);
    for (const shot of shots) {
      const tab = await ChromeTab.open(chromePort, `http://localhost:${serverPort}${shot.path}`);
      await tab.setViewport(shot.viewport.width, shot.viewport.height);
      await sleep(400);
      const out = join(root, 'screenshots', shot.file);
      await tab.screenshot(out, 82);
      let size = statSync(out).size;
      if (size > 256 * 1024) {
        await tab.screenshot(out, 68);
        size = statSync(out).size;
      }
      console.log(`${shot.file}: ${size} bytes (limit 262144)`);
      if (size > 256 * 1024) throw new Error(`${shot.file} is still over the 256 KiB cap at quality 68`);
      tab.close();
      await sleep(300);
    }
  } finally {
    chrome.kill();
    server.kill();
  }
  void CHROME;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
