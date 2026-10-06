// Renders Instagram highlight covers (1080×1920 story + 1080×1080 square) into highlights/.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const ROOT = '/Users/bmi/Desktop/100story';
const BASE = process.env.BASE || 'http://127.0.0.1:8080';
const LIST = JSON.parse(fs.readFileSync(`${ROOT}/_work/highlights/list.json`, 'utf8'));
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--force-color-profile=srgb'] });
const page = await browser.newPage();
for (const h of LIST) {
  const dir = `${ROOT}/highlights/${h.dir}`; fs.mkdirSync(dir, { recursive: true });
  for (const sq of [0, 1]) {
    await page.setViewport({ width: 1080, height: sq ? 1080 : 1920, deviceScaleFactor: 1 });
    await page.goto(`${BASE}/_work/highlights/cover.html?k=${h.k}${sq ? '&sq=1' : ''}`, { waitUntil: 'load' });
    await page.waitForFunction('window.__ready===true', { timeout: 30000 });
    await page.screenshot({ path: `${dir}/00-cover${sq ? '-square' : ''}.jpg`, type: 'jpeg', quality: 95 });
  }
  console.log('cover', h.dir);
}
await browser.close();
