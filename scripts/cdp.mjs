// A minimal Chrome DevTools Protocol client, Node standard library only.
// It launches headless Chromium, opens one tab, and drives it over the
// DevTools WebSocket: navigate, run JavaScript, and capture screenshots.
// Used by scripts/shots.mjs (screenshots) and scripts/e2e.mjs (end-to-end).

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

// The stock Chromium bundled with the shot tools. The Hatch CVM build at
// /opt/meta-chromium/chrome refuses to start here (it demands a Hatch WebGL
// domain policy), so screenshots and end-to-end checks use this binary.
export const CHROME = '/home/hatch/workspace/makefun/shot-tools/browsers/chromium-1255/chrome-linux64/chrome';

export async function waitForHttp(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${url}`);
    await sleep(200);
  }
}

export class ChromeTab {
  constructor(webSocket, targetId) {
    this.socket = webSocket;
    this.targetId = targetId;
    this.nextId = 1;
    this.pending = new Map();
    this.loadWaiters = [];
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
      } else if (message.method === 'Page.loadEventFired') {
        for (const resolve of this.loadWaiters.splice(0)) resolve();
      }
    });
  }

  static async open(chromePort, url) {
    const targets = await (await fetch(`http://127.0.0.1:${chromePort}/json/list`)).json();
    let target = targets.find((t) => t.type === 'page');
    if (!target) throw new Error('no page target in headless Chrome');
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve);
      socket.addEventListener('error', reject);
    });
    const tab = new ChromeTab(socket, target.id);
    await tab.send('Page.enable');
    await tab.send('Runtime.enable');
    await tab.navigate(url);
    return tab;
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  waitForLoad(timeoutMs = 15000) {
    return Promise.race([
      new Promise((resolve) => this.loadWaiters.push(resolve)),
      sleep(timeoutMs).then(() => { throw new Error('timed out waiting for page load'); }),
    ]);
  }

  async navigate(url) {
    const loaded = this.waitForLoad();
    await this.send('Page.navigate', { url });
    await loaded;
    await sleep(1200);
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(`page error: ${result.exceptionDetails.text} ${result.exceptionDetails.exception?.description ?? ''}`);
    }
    return result.result.value;
  }

  // Pin the layout viewport: headless Chrome's --window-size is not
  // reliable on its own (it came up 1280x600), so set metrics explicitly.
  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
  }

  async screenshot(file, quality = 82) {
    const shot = await this.send('Page.captureScreenshot', { format: 'jpeg', quality });
    const { writeFileSync } = await import('node:fs');
    writeFileSync(file, Buffer.from(shot.data, 'base64'));
  }

  close() {
    this.socket.close();
  }
}

export function launchChrome(port, userDataDir) {
  const child = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    `--remote-debugging-port=${port}`,
    '--window-size=1280,800',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ], { stdio: 'ignore' });
  return child;
}
