// Renders every story to MP4 (1080×1920, 30 fps, H.264 + AAC music) and a poster JPG.
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const ROOT = '/Users/bmi/Desktop/100story';
const FF = '/Users/bmi/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1';
const MUSIC = '/Users/bmi/Desktop/GHORBANI/Background Clip Music - 36.mp3';
const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const FPS = 30, WORKERS = +(process.env.W || 4);
const src = fs.readFileSync(`${ROOT}/stories/data.js`, 'utf8');
const DATA = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));
const only = process.argv.slice(2);
const force = process.env.FORCE === '1';
let queue = DATA.filter(d => !only.length || only.includes(d.slug)).filter(d => force || !fs.existsSync(`${ROOT}/videos/${d.slug}.mp4`));
const manifestPath = `${ROOT}/videos/manifest.json`;
const writeManifest = () => {
  const list = DATA.filter(d => fs.existsSync(`${ROOT}/videos/${d.slug}.mp4`)).map(d => d.slug);
  if (fs.existsSync(`${ROOT}/videos/all-stories.zip`)) list.push('__zip__');
  fs.writeFileSync(manifestPath, JSON.stringify(list));
};
const launch = () => puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new',
  args: ['--force-color-profile=srgb', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
const t0 = Date.now(); let done = 0; const total = queue.length;

async function renderOne(page, d) {
  await page.goto(`${BASE}/stories/story.html?id=${d.slug}&mode=render`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready===true', { timeout: 240000 });
  const dur = await page.evaluate('window.__duration');
  const frames = Math.round(dur * FPS);
  const tmp = `${ROOT}/videos/.${d.slug}.mp4`;
  const musicStart = ((d.n * 37) % 200) + 5;  // a different part of the track for each story
  const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-ss', String(musicStart), '-i', MUSIC, '-map', '0:v', '-map', '1:a', '-t', (frames / FPS).toFixed(3),
    '-af', `afade=t=in:d=0.6,afade=t=out:st=${(frames / FPS - 1.4).toFixed(2)}:d=1.4,volume=0.85`,
    '-vf', 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-f', 'mp4', tmp]);
  let err = ''; ff.stderr.on('data', b => err += b);
  const closed = new Promise(r => ff.on('close', r));
  const cdp = await page.createCDPSession();
  const posterT = d.kind === 'brand' ? 2.6 : 2.8;
  for (let i = 0; i < frames; i++) {
    const t = i / FPS;
    await page.evaluate(t => window.__seek(t), t);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95, optimizeForSpeed: true, captureBeyondViewport: false });
    const buf = Buffer.from(data, 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (Math.abs(t - posterT) < 0.5 / FPS) fs.writeFileSync(`${ROOT}/posters/${d.slug}.jpg`, buf);
  }
  ff.stdin.end(); const code = await closed; await cdp.detach();
  if (code !== 0) throw new Error(`ffmpeg ${code}: ${err}`);
  fs.renameSync(tmp, `${ROOT}/videos/${d.slug}.mp4`);
  writeManifest();
  done++; const el = (Date.now() - t0) / 1000;
  console.log(`${done}/${total} ${d.slug} ${frames}f  elapsed ${el.toFixed(0)}s  eta ${((el / done) * (total - done) / 60).toFixed(1)}min`);
}
async function worker() {
  // one browser per worker: pages in background tabs stall image decoding.
  // A crashed browser/page is relaunched and the story retried once instead of failing the rest of the queue.
  let browser, page;
  const start = async () => {
    try { await browser?.close(); } catch {}
    browser = await launch();
    page = (await browser.pages())[0] || await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    page.on('pageerror', e => console.log('PAGEERR', e.message));
  };
  await start();
  while (queue.length) {
    const d = queue.shift();
    for (let attempt = 1; attempt <= 2; attempt++) {
      try { await renderOne(page, d); break; }
      catch (e) { console.log(attempt === 1 ? 'RETRY' : 'FAIL', d.slug, e.message); fs.rmSync(`${ROOT}/videos/.${d.slug}.mp4`, { force: true }); await start(); }
    }
  }
  try { await browser.close(); } catch {}
}
await Promise.all(Array.from({ length: Math.min(WORKERS, queue.length || 1) }, worker));
writeManifest();
console.log('ALL DONE', ((Date.now() - t0) / 60000).toFixed(1), 'min');
process.exit(0);
