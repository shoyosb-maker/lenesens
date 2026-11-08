/* ============================================================
   Lenesens · Servidor de desarrollo (Node 18+, sin dependencias)
   Sirve el sitio estático en local para revisarlo en el navegador.

   Uso:
     node server/dev-server.js            → http://localhost:4173
     node server/dev-server.js 8080       → http://localhost:8080
     PORT=8080 node server/dev-server.js

   - Resuelve "/" y carpetas hacia index.html
   - Soporta Range (necesario para los videos del hero)
   - Sin caché para ver los cambios al recargar
   ============================================================ */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || 'localhost';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.hdr': 'application/octet-stream',
  '.map': 'application/json; charset=utf-8',
  '.ndjson': 'application/x-ndjson; charset=utf-8'
};

const textStatus = (res, status, message) => {
  const body = `<!DOCTYPE html><html lang="es"><meta charset="utf-8"><title>${status}</title>` +
    `<body style="font:16px/1.5 system-ui,sans-serif;padding:3rem;color:#1b1c1a">` +
    `<h1 style="color:#7f003b">${status}</h1><p>${message}</p>` +
    `<p><a href="/" style="color:#7f003b">Volver al inicio</a></p></body></html>`;
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
};

/* Carpetas/archivos privados que el servidor nunca debe mostrar */
const isPrivate = (segments) => {
  if (segments[0] === 'server') return true;
  return segments.some((segment) => segment.startsWith('.') && segment !== '.');
};

/* Ruta del sistema de archivos pedida, o null si intenta salir de ROOT */
const resolveTarget = (pathname) => {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  if (decoded.includes('\0')) return null;

  const normalized = path.posix.normalize(decoded);
  if (isPrivate(normalized.split('/').filter(Boolean))) return null;

  const target = path.resolve(ROOT, '.' + normalized);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) return null;
  return target;
};

const statOrNull = async (filePath) => {
  try {
    return await fsp.stat(filePath);
  } catch {
    return null;
  }
};

/* Busca el archivo real: exacto, +.html o index.html de la carpeta */
const findFile = async (target) => {
  const info = await statOrNull(target);
  if (info?.isFile()) return target;

  if (info?.isDirectory()) {
    const index = path.join(target, 'index.html');
    return (await statOrNull(index))?.isFile() ? index : null;
  }

  if (!path.extname(target)) {
    const withHtml = `${target}.html`;
    if ((await statOrNull(withHtml))?.isFile()) return withHtml;
  }

  return null;
};

const parseRange = (header, size) => {
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(header || '').trim());
  if (!match) return null;

  let start = match[1] === '' ? null : Number(match[1]);
  let end = match[2] === '' ? null : Number(match[2]);

  if (start === null && end === null) return null;
  if (start === null) {
    start = Math.max(0, size - end);
    end = size - 1;
  } else if (end === null || end >= size) {
    end = size - 1;
  }

  if (start >= size || start > end) return { invalid: true };
  return { start, end };
};

const sendFile = async (req, res, filePath, size) => {
  const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  const headers = {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'Accept-Ranges': 'bytes',
    'Last-Modified': new Date((await fsp.stat(filePath)).mtimeMs).toUTCString()
  };

  const range = parseRange(req.headers.range, size);

  if (range?.invalid) {
    res.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` });
    res.end();
    return;
  }

  if (range) {
    const length = range.end - range.start + 1;
    res.writeHead(206, {
      ...headers,
      'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
      'Content-Length': length
    });

    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(filePath, { start: range.start, end: range.end })
      .on('error', () => res.end())
      .pipe(res);
    return;
  }

  res.writeHead(200, { ...headers, 'Content-Length': size });
  if (req.method === 'HEAD') { res.end(); return; }
  fs.createReadStream(filePath)
    .on('error', () => res.end())
    .pipe(res);
};

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  let pathname;
  try {
    pathname = new URL(req.url, `http://${req.headers.host || HOST}`).pathname;
  } catch {
    textStatus(res, 400, 'Petición inválida.');
    return;
  }

  const target = resolveTarget(pathname);
  if (!target) {
    textStatus(res, 403, 'Ruta no disponible.');
    return;
  }

  const filePath = await findFile(target);
  if (!filePath) {
    console.log(`  404  ${pathname}`);
    textStatus(res, 404, `No se encontró <code>${pathname.replace(/[<>&]/g, '')}</code>.`);
    return;
  }

  const info = await fsp.stat(filePath);
  console.log(`  ${req.method === 'HEAD' ? 'HEAD' : '200 '}  ${pathname}`);
  await sendFile(req, res, filePath, info.size);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`✖ El puerto ${PORT} ya está en uso. Prueba: node server/dev-server.js ${PORT + 1}`);
    process.exit(1);
  }
  console.error('✖ Error del servidor:', err.message);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  🌸 Lenesens Hydralight · servidor de desarrollo');
  console.log(`  ➜ Sitio:      http://${HOST}:${PORT}/`);
  console.log(`  ➜ Raíz:       ${ROOT}`);
  console.log(`  ➜ Panel:      http://${HOST}:${PORT}/admin.html`);
  console.log('  (Ctrl+C para detener)');
  console.log('');
});
