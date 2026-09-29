import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const positionalPort = args.find(arg => /^\d+$/.test(arg));
const port = Number(portIndex >= 0 ? args[portIndex + 1] : positionalPort || process.env.PORT || 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Port must be an integer between 1 and 65535.');
}
const root = fileURLToPath(new URL(args.includes('--dist') ? '../dist/' : '../', import.meta.url));
const entry = 'Solsolbaram_Jump_obstacle_names.html';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? entry : pathname.slice(1);
    // Only serve game assets, never Git metadata, scripts, or local documents.
    if (!([entry, 'index.html'].includes(relative) || /^(src|styles|assets)\//.test(relative))) {
      response.writeHead(404); response.end('Not found'); return;
    }
    const target = path.resolve(root, relative);
    const within = path.relative(root, target);
    if (within.startsWith('..') || path.isAbsolute(within)) {
      response.writeHead(403); response.end('Forbidden'); return;
    }
    const content = await readFile(target);
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 400);
    response.end(error.code === 'ENOENT' ? 'Not found (run npm run build before preview)' : 'Bad request');
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Game: http://127.0.0.1:${port}/`));
