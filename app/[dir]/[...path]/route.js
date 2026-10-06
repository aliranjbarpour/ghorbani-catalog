// Serves the story folders straight from disk (so files the site writes at runtime — texts.js, new videos,
// uploaded music — are available without a rebuild). Videos and audio support Range requests for seeking.
// ?dl=1 makes the browser save the file instead of playing it.
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { ROOT } from '../../../lib/store.js';

export const dynamic = 'force-dynamic';
const DIRS = new Set(['assets', 'stories', 'videos', 'posters', 'shots', 'music', 'generated']);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.flac': 'audio/flac', '.zip': 'application/zip',
};
const dec = s => { try { return decodeURIComponent(s); } catch { return s; } };

export async function GET(req, { params }) {
  const { dir, path: parts } = await params;
  if (!DIRS.has(dir)) return new Response('Not found', { status: 404 });
  const base = path.join(/*turbopackIgnore: true*/ ROOT, dir);
  const file = path.join(base, ...parts.map(dec));
  if (!file.startsWith(base + path.sep)) return new Response('Not found', { status: 404 });
  let st;
  try { st = fs.statSync(file); } catch { return new Response('Not found', { status: 404 }); }
  if (!st.isFile()) return new Response('Not found', { status: 404 });

  const ext = path.extname(file).toLowerCase();
  const media = /^(video|audio)\//.test(TYPES[ext] || '');
  const headers = {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Last-Modified': new Date(st.mtimeMs).toUTCString(),
    'Cache-Control': 'no-cache',
    'Accept-Ranges': 'bytes',
  };
  const url = new URL(req.url);
  if (url.searchParams.has('dl')) {
    const name = url.searchParams.get('dl') || path.basename(file);
    headers['Content-Disposition'] = `attachment; filename="${name.replace(/[^\w.-]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`;
  }
  const ims = req.headers.get('if-modified-since');
  if (ims && !media && Math.floor(st.mtimeMs / 1000) <= Math.floor(Date.parse(ims) / 1000)) return new Response(null, { status: 304, headers });

  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  if (range && (range[1] || range[2])) {
    let start = range[1] ? +range[1] : st.size - +range[2];
    let end = range[1] && range[2] ? Math.min(+range[2], st.size - 1) : st.size - 1;
    start = Math.max(0, start);
    if (start > end) return new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${st.size}` } });
    return new Response(Readable.toWeb(fs.createReadStream(file, { start, end })), {
      status: 206, headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': String(end - start + 1) },
    });
  }
  return new Response(Readable.toWeb(fs.createReadStream(file)), { headers: { ...headers, 'Content-Length': String(st.size) } });
}
