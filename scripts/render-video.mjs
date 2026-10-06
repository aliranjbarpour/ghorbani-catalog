// Renders one story to MP4 (1080×1920, 30 fps, H.264 + AAC) with the chosen song — used by the site's «ساخت ویدیو».
// Same capture as _work/render/render.mjs; the song loops if it is shorter than the story.
// usage: BASE=http://127.0.0.1:3000 node scripts/render-video.mjs '{"slug","music","start","out","poster","posterT"}'
// stdout: "FRAMES n", "P i" (progress), "ENCODE", "DONE"
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const job = JSON.parse(process.argv[2]);
const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const FF = process.env.FFMPEG || 'ffmpeg';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FPS = 30;
const tmp = job.out + '.part';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--force-color-profile=srgb', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
try {
  const page = (await browser.pages())[0] || await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGEERR', e.message));
  await page.goto(`${BASE}/stories/story.html?id=${job.slug}&mode=render`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready===true', { timeout: 240000 });
  const dur = await page.evaluate('window.__duration');
  const frames = Math.round(dur * FPS), secs = frames / FPS;
  console.log(`FRAMES ${frames}`);

  const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-stream_loop', '-1', '-ss', String(job.start || 0), '-i', job.music, '-map', '0:v', '-map', '1:a', '-t', secs.toFixed(3),
    '-af', `afade=t=in:d=0.6,afade=t=out:st=${(secs - 1.4).toFixed(2)}:d=1.4,volume=0.85`,
    '-vf', 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-profile:v', 'high', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-f', 'mp4', tmp]);
  let err = ''; ff.stderr.on('data', b => err += b);
  ff.stdin.on('error', () => {});
  const closed = new Promise(r => ff.on('close', r));
  const cdp = await page.createCDPSession();
  for (let i = 0; i < frames; i++) {
    const t = i / FPS;
    await page.evaluate(t => window.__seek(t), t);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95, optimizeForSpeed: true, captureBeyondViewport: false });
    const buf = Buffer.from(data, 'base64');
    if (ff.exitCode !== null) break;
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (job.poster && Math.abs(t - job.posterT) < 0.5 / FPS) fs.writeFileSync(job.poster, buf);
    if (i % 10 === 9) console.log(`P ${i + 1}`);
  }
  console.log('ENCODE');
  ff.stdin.end();
  const code = await closed;
  if (code !== 0) throw new Error(`ffmpeg ${code}: ${err.trim()}`);
  fs.renameSync(tmp, job.out);
  console.log('DONE');
} catch (e) {
  fs.rmSync(tmp, { force: true });
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await browser.close().catch(() => {});
}
