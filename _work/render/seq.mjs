import puppeteer from 'puppeteer-core';
const [,, id, ...ts] = process.argv;
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const p = (await b.pages())[0]; await p.setViewport({ width: 1080, height: 1920 });
await p.goto(`http://localhost:8080/stories/story.html?id=${id}&mode=render`); await p.waitForFunction('window.__ready===true');
const out = '/private/tmp/claude-501/-Users-bmi-Desktop-100story/efaa33fd-434c-49d2-8891-cb3b402c0614/scratchpad';
for (const t of ts) { await p.evaluate(t => window.__seek(t), +t); await p.screenshot({ path: `${out}/s_${t}.jpg`, type: 'jpeg', quality: 70, clip: { x: 0, y: 0, width: 1080, height: 1920, scale: .25 } }); }
await b.close();
