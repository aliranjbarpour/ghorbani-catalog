// Video build queue (one story at a time — each build drives a headless Chrome and ffmpeg).
// The state lives on globalThis so it survives hot reloads in `next dev`.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, p, GEN_DIR, MUSIC_DIR, readData } from './store.js';

const S = (globalThis.__storyJobs ??= { queue: [], running: null, bySlug: {}, n: 0 });

const FFMPEG = process.env.FFMPEG || [
  '/Users/bmi/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1',
  '/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg',
].find(f => fs.existsSync(f)) || 'ffmpeg';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const stamp = () => {
  const d = new Date(), z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}_${z(d.getHours())}-${z(d.getMinutes())}-${z(d.getSeconds())}`;
};
const pub = j => ({ ...j, pos: j.state === 'queued' ? S.queue.indexOf(j) + 1 : 0 });

export function jobFor(slug) {
  const j = S.bySlug[slug];
  return j ? pub(j) : null;
}

export function enqueue({ story, music, start, replace, base }) {
  const cur = S.bySlug[story.slug];
  if (cur && (cur.state === 'queued' || cur.state === 'running')) return pub(cur);
  const j = { id: ++S.n, slug: story.slug, kind: story.kind, fa: story.fa, music, start, replace, base,
    state: 'queued', stage: '', progress: 0, file: '', url: '', error: '', warn: '' };
  S.bySlug[story.slug] = j;
  S.queue.push(j);
  pump();
  return pub(j);
}

function pump() {
  if (S.running || !S.queue.length) return;
  const j = (S.running = S.queue.shift());
  j.state = 'running'; j.stage = 'prepare';
  build(j).then(() => { j.state = 'done'; j.progress = 1; },
    e => { j.state = 'error'; j.error = String(e.message || e).slice(-600); })
    .finally(() => { S.running = null; pump(); });
}

// runs a command; onLine gets each stdout line
function run(cmd, args, opts, onLine) {
  return new Promise((resolve, reject) => {
    const c = spawn(cmd, args, { ...opts, env: { ...process.env, ...opts.env } });
    let buf = '', err = '';
    c.stdout.on('data', b => { buf += b; let i; while ((i = buf.indexOf('\n')) >= 0) { onLine?.(buf.slice(0, i)); buf = buf.slice(i + 1); } });
    c.stderr.on('data', b => { err = (err + b).slice(-2000); });
    c.on('error', reject);
    c.on('close', code => (code ? reject(new Error(err.trim() || `${path.basename(args[0] || cmd)} exited ${code}`)) : resolve()));
  });
}

async function build(j) {
  const dir = path.join(GEN_DIR, j.slug);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${j.slug}_${stamp()}`;
  const out = path.join(dir, `${name}.mp4`);
  const cfg = { slug: j.slug, music: path.join(MUSIC_DIR, j.music), start: j.start, out,
    poster: j.replace ? p('posters', `${j.slug}.jpg`) : '', posterT: j.kind === 'brand' ? 2.6 : 2.8 };
  let frames = 0;
  await run(process.execPath, [p('scripts', 'render-video.mjs'), JSON.stringify(cfg)],
    { cwd: ROOT, env: { BASE: j.base, FFMPEG, CHROME } },
    line => {
      const [k, v] = line.split(' ');
      if (k === 'FRAMES') { frames = +v; j.stage = 'frames'; }
      if (k === 'P' && frames) j.progress = Math.min(.97, (+v / frames) * .97);
      if (k === 'ENCODE') j.stage = 'encode';
    });
  fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify({ music: j.music, start: j.start, at: Date.now(), fa: j.fa }));
  j.file = `${name}.mp4`;
  j.url = `/generated/${j.slug}/${j.file}`;
  if (j.replace) await replaceMain(j, out);
}

// the new video becomes the story's main video: videos/, poster (written by the render), shot stills and highlights
async function replaceMain(j, out) {
  const tmp = p('videos', `.${j.slug}.mp4`);
  fs.copyFileSync(out, tmp);
  fs.renameSync(tmp, p('videos', `${j.slug}.mp4`));
  const list = readData().filter(d => fs.existsSync(p('videos', `${d.slug}.mp4`))).map(d => d.slug);
  if (fs.existsSync(p('videos', 'all-stories.zip'))) list.push('__zip__');
  fs.writeFileSync(p('videos', 'manifest.json'), JSON.stringify(list));
  const warn = [];
  j.stage = 'shots';
  await run(process.execPath, ['shots.mjs', j.slug], { cwd: p('_work', 'render'), env: { BASE: j.base, W: '1' } }).catch(e => warn.push('شات‌ها: ' + e.message));
  j.stage = 'highlights';
  await run('python3', [p('_work', 'highlights', 'sync.py')], { cwd: ROOT }).catch(e => warn.push('هایلایت‌ها: ' + e.message));
  j.warn = warn.join(' — ').slice(-400);
}
