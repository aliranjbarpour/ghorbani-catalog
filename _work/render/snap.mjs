import puppeteer from 'puppeteer-core';
const [,, id, ...times] = process.argv;
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args:['--allow-file-access-from-files','--force-color-profile=srgb'] });
const p = await b.newPage();
await p.setViewport({ width: 1080, height: 1920 });
p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto(`http://127.0.0.1:8765/stories/story.html?id=${id}&mode=render`);
await p.waitForFunction('window.__ready===true', { timeout: 30000 });
for (const t of times) { await p.evaluate(t => window.__seek(t), +t); await p.screenshot({ path: `/Users/bmi/Desktop/100story/_work/snap_${id}_${t}.jpg`, type: 'jpeg', quality: 80 }); }
console.log('dur', await p.evaluate('window.__duration'));
await b.close();
