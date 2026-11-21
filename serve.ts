// A minimal static server for game/ (Node 22, standard library only) so
// the entry can be played locally with no build step:
//
//   node serve.ts            serves game/ on http://localhost:8080
//   node serve.ts --port 9000   serves it on port 9000 instead
//
// It only answers GETs for files inside game/, with the right content type,
// and refuses anything that would climb out of that folder. A development
// convenience, not a server for the internet.
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameDir = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const portArg = process.argv.indexOf('--port');
const wantedPort = portArg === -1 ? NaN : Number(process.argv[portArg + 1]);
const port = Number.isInteger(wantedPort) && wantedPort > 0 && wantedPort < 65536 ? wantedPort : 8080;

const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
]);

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(join(gameDir, path));
    if (file !== gameDir && !file.startsWith(gameDir + sep)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types.get(extname(file)) ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Galeri Senja served at http://127.0.0.1:${port}/`);
});
