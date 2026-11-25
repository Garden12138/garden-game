import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const address = 'http://127.0.0.1:8000';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const path = decodeURIComponent(new URL(request.url, address).pathname);
    const file = await realpath(resolve(root, path === '/' ? 'index.html' : '.' + path));
    const local = relative(root, file).split(/[\\/]/);
    const allowed = local.length === 1 ? local[0] === 'index.html' : ['assets', 'styles', 'src'].includes(local[0]);
    if (!allowed) {
      response.writeHead(404).end();
      return;
    }
    const data = await readFile(file);
    response.writeHead(200, {
      'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': 'no-cache',
    }).end(request.method === 'HEAD' ? undefined : data);
  } catch {
    response.writeHead(404).end();
  }
});

server.on('error', error => {
  console.error('擂台服务器启动失败。', error.message);
  process.exitCode = 1;
});
server.listen(8000, '127.0.0.1', () => console.log('擂台已就绪。', address));
