// Leonida Ledger — a small static server for local testing only.
//
// Serves the app/ directory on http://localhost:8080 (or --port <n>).
// It answers only files inside app/, sends the right content type, and
// never reaches the network. Start it, open the page in desktop Chrome,
// and the guide works exactly as it will when hosted: no build step.

import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));

const args = process.argv.slice(2);
const portFlag = args.indexOf('--port');
const wanted = portFlag === -1 ? 8080 : Number(args[portFlag + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function insideApp(pathname: string): string | null {
  const decoded = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const file = resolve(join(appRoot, decoded));
  if (file !== appRoot && !file.startsWith(appRoot + sep)) return null;
  return file;
}

createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  const file = insideApp(pathname);
  if (file === null) {
    response.writeHead(403).end('forbidden');
    return;
  }
  let body: Buffer;
  try {
    if (!statSync(file).isFile()) throw new Error('not a file');
    body = readFileSync(file);
  } catch {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': contentTypes[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': body.length,
    'cache-control': 'no-store',
  });
  response.end(body);
}).listen(port, '127.0.0.1', () => {
  console.log(`Leonida Ledger is on http://localhost:${port}`);
});
