// POST { slug, music, start, replace } -> queues a video build for that story with the chosen song
// GET  ?slug=...                        -> { job, built: [videos already made for this story] }
import fs from 'node:fs';
import path from 'node:path';
import { readData, listBuilt, MUSIC_DIR } from '../../../lib/store.js';
import { enqueue, jobFor } from '../../../lib/jobs.js';

export const dynamic = 'force-dynamic';

export function GET(req) {
  const slug = new URL(req.url).searchParams.get('slug') || '';
  return Response.json({ job: jobFor(slug), built: listBuilt(slug) });
}

export async function POST(req) {
  const b = await req.json().catch(() => null);
  const d = b && readData().find(x => x.slug === b.slug);
  if (!d) return Response.json({ error: 'استوری پیدا نشد' }, { status: 400 });
  const music = path.basename(String(b.music || ''));
  if (!music || !fs.existsSync(path.join(MUSIC_DIR, music))) return Response.json({ error: 'آهنگ پیدا نشد' }, { status: 400 });
  const start = Math.max(0, Math.min(3600, Number(b.start) || 0));
  const job = enqueue({ story: d, music, start, replace: !!b.replace, base: new URL(req.url).origin });
  return Response.json({ job });
}
