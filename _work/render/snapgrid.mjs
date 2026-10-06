import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
const [,, id, from, step] = process.argv;
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const p = (await b.pages())[0];
await p.setViewport({ width: 1080, height: 1920 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto(`http://127.0.0.1:8765/stories/story.html?id=${id}&mode=render`);
await p.waitForFunction('window.__ready===true', { timeout: 60000 });
const dur = await p.evaluate('window.__duration'); console.log(id, 'duration', dur.toFixed(1));
const files = [];
for (let t = +from; t < dur; t += +step) { await p.evaluate(t => window.__seek(t), t); const f = `/Users/bmi/Desktop/100story/_work/g_${id}_${t.toFixed(1)}.jpg`; await p.screenshot({ path: f, type: 'jpeg', quality: 80 }); files.push(f); }
await b.close();
execFileSync('python3', ['-c', `
import sys
from PIL import Image
fs=sys.argv[1:]; ims=[Image.open(f).resize((360,640)) for f in fs]
S=Image.new('RGB',(365*len(ims),640),'white')
for i,im in enumerate(ims): S.paste(im,(i*365,0))
S.save('/Users/bmi/Desktop/100story/_work/grid_${id}.jpg',quality=85)`, ...files]);
