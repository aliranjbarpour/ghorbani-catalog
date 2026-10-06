import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const p = (await b.pages())[0];
await p.setViewport({ width: 1440, height: 900 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('http://127.0.0.1:8765/studio.html?id=054-M188');
await new Promise(r => setTimeout(r, 3500));
await p.click('#play');
await new Promise(r => setTimeout(r, 9000));
console.log(await p.evaluate(() => [document.querySelector('#tNow').textContent, document.querySelector('#bar').style.width, document.querySelector('#title').textContent, document.querySelectorAll('.item').length,
  typeof CropTarget, MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.640033,mp4a.40.2')]));
await p.screenshot({ path: '/Users/bmi/Desktop/100story/_work/studio_shot.jpg', type: 'jpeg', quality: 80 });
await p.click('.chip[data-f="rumi"]'); await new Promise(r => setTimeout(r, 300));
console.log('rumi items', await p.evaluate(() => document.querySelectorAll('.item').length));
await b.close();
