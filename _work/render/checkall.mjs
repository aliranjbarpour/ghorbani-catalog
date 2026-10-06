import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const src = fs.readFileSync('/Users/bmi/Desktop/100story/stories/data.js', 'utf8');
const D = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const p = (await b.pages())[0]; await p.setViewport({ width: 1080, height: 1920 });
let errs = []; p.on('pageerror', e => errs.push(e.message));
const durs = {};
for (const d of D.filter(x => x.kind === "rumi")) {
  errs = [];
  await p.goto(`http://127.0.0.1:8765/stories/story.html?id=${d.slug}&mode=render`);
  await p.waitForFunction('window.__ready===true', { timeout: 60000 }).catch(() => errs.push('not ready'));
  // overflow check: spec cards whose content exceeds the card
  const r = await p.evaluate(() => { const bad = []; document.querySelectorAll('.spec').forEach((c, i) => { const body = c.querySelector('.sp-body'); if (body.scrollHeight > body.clientHeight + 4) bad.push(i + 1); }); return { d: window.__duration, bad }; });
  durs[d.slug] = r.d;
  if (errs.length || r.bad.length) console.log(d.slug, errs.join('|'), r.bad.length ? 'overflow shots ' + r.bad : '');
}
const v = Object.values(durs);
console.log('min', Math.min(...v).toFixed(1), 'max', Math.max(...v).toFixed(1), 'avg', (v.reduce((a, b) => a + b) / v.length).toFixed(1));
await b.close();
