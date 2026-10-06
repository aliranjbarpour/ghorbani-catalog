// Exports a still of every shot of every story: shots/<slug>/NN.jpg (1080×1920) + NN-s.jpg (thumb) + shots/manifest.json
// usage: node shots.mjs [slug ...]     env: BASE (default http://127.0.0.1:3000), W (workers)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const ROOT = '/Users/bmi/Desktop/100story';
const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const WORKERS = +(process.env.W || 4);
const src = fs.readFileSync(`${ROOT}/stories/data.js`, 'utf8');
const DATA = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));
const only = process.argv.slice(2);
const queue = DATA.filter(d => !only.length || only.includes(d.slug));
const manPath = `${ROOT}/shots/manifest.json`;
fs.mkdirSync(`${ROOT}/shots`, { recursive: true });
const manifest = fs.existsSync(manPath) ? JSON.parse(fs.readFileSync(manPath, 'utf8')) : {};
const t0 = Date.now(); let done = 0; const total = queue.length;

async function one(page, d) {
  await page.goto(`${BASE}/stories/story.html?id=${d.slug}&mode=render`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready===true', { timeout: 120000 });
  const shots = await page.evaluate('window.__shots');
  const dir = `${ROOT}/shots/${d.slug}`;
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (const [i, s] of shots.entries()) {
    await page.evaluate(t => window.__seek(t), s.t);
    const n = String(i + 1).padStart(2, '0');
    await page.screenshot({ path: `${dir}/${n}.jpg`, type: 'jpeg', quality: 88 });
    await page.screenshot({ path: `${dir}/${n}-s.jpg`, type: 'jpeg', quality: 78, clip: { x: 0, y: 0, width: 1080, height: 1920, scale: .25 } });
  }
  manifest[d.slug] = shots.map(s => ({ t: s.t, from: s.from, label: s.label }));
  done++; console.log(`${done}/${total} ${d.slug} ${shots.length} shots  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
async function worker() {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--force-color-profile=srgb'] });
  const page = (await browser.pages())[0] || await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('PAGEERR', e.message));
  while (queue.length) { const d = queue.shift(); try { await one(page, d); } catch (e) { console.log('FAIL', d.slug, e.message); } }
  await browser.close();
}
await Promise.all(Array.from({ length: Math.min(WORKERS, queue.length || 1) }, worker));
const ordered = Object.fromEntries(DATA.filter(d => manifest[d.slug]).map(d => [d.slug, manifest[d.slug]]));
fs.writeFileSync(manPath, JSON.stringify(ordered));
console.log('ALL DONE', ((Date.now() - t0) / 60000).toFixed(1), 'min');
