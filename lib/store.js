// Server-side access to the story folders: data.js, the Persian text edits (stories/texts.js), music and built videos.
import fs from 'node:fs';
import path from 'node:path';
import { EDITABLE_KINDS, fieldsFor, origValue } from './fields.js';

export const ROOT = /*turbopackIgnore: true*/ process.cwd();
export const p = (...a) => path.join(/*turbopackIgnore: true*/ ROOT, ...a);
export const MUSIC_DIR = p('music');
export const GEN_DIR = p('generated');
export const AUDIO_EXT = /\.(mp3|m4a|aac|wav|ogg|flac)$/i;

const readJson = (f, def) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return def; } };
const mtime = f => { try { return fs.statSync(f).mtimeMs; } catch { return 0; } };

export function readData() {
  const src = fs.readFileSync(p('stories', 'data.js'), 'utf8');
  return JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));
}

/* ---------- stories/texts.js: window.STORY_TEXTS = { slug: { fa, desc, feats, apps, _at } } ---------- */
const TEXTS = p('stories', 'texts.js');
const MARK = 'window.STORY_TEXTS = ';
const TEXTS_HEAD = `// متن‌های فارسی ویرایش‌شده‌ی استوری‌ها — روی متن کاتالوگ (data.js) نوشته می‌شوند و با ساخت دوباره‌ی data.js از بین نمی‌روند.
// از پنجره‌ی هر استوری در سایت (npm run dev) ویرایش می‌شود. _at زمان آخرین ویرایش است.
`;
const TEXTS_TAIL = `;
(function () {
  const T = window.STORY_TEXTS;
  (window.STORY_DATA || []).forEach(d => { const o = T[d.slug]; if (o) ["fa", "desc", "feats", "apps"].forEach(k => { if (o[k] != null) d[k] = o[k]; }); });
})();
`;
// a broken file throws (instead of reading as empty) so a save never wipes the other stories' edits
export function readTexts() {
  if (!fs.existsSync(TEXTS)) return {};
  const src = fs.readFileSync(TEXTS, 'utf8');
  const i = src.indexOf(MARK) + MARK.length;
  return JSON.parse(src.slice(i, src.indexOf('\n};', i) + 2));
}
export function writeTexts(t) {
  const body = Object.keys(t).length ? JSON.stringify(t, null, 1) : '{}';
  fs.writeFileSync(TEXTS, TEXTS_HEAD + MARK + body.replace(/\n?}$/, '\n}') + TEXTS_TAIL);
}

/* ---------- music + built videos ---------- */
export function listMusic() {
  fs.mkdirSync(MUSIC_DIR, { recursive: true });
  return fs.readdirSync(MUSIC_DIR).filter(f => AUDIO_EXT.test(f) && !f.startsWith('.')).sort((a, b) => a.localeCompare(b, 'fa'));
}
export function listBuilt(slug) {
  const dir = path.join(GEN_DIR, slug);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.mp4')).sort().reverse().map(f => {
    const meta = readJson(path.join(dir, f.replace(/\.mp4$/, '.json')), {});
    return { file: f, url: `/generated/${slug}/${f}`, music: meta.music || '', start: meta.start || 0, at: meta.at || 0,
      size: fs.statSync(path.join(dir, f)).size };
  });
}

/* ---------- everything the landing page needs ---------- */
export function storyView(d, texts) {
  const o = texts[d.slug] || {};
  const editable = EDITABLE_KINDS.includes(d.kind);
  const orig = {}, edited = {};
  if (editable) for (const f of fieldsFor(d.kind)) { orig[f.k] = origValue(d, f.k); if (o[f.k] != null) edited[f.k] = true; }
  const v = { ...d, ...Object.fromEntries(Object.keys(edited).map(k => [k, o[k]])), orig, edited, editable };
  const vt = mtime(p('videos', `${d.slug}.mp4`));
  v.video = !!vt;
  // the story text changed after its video was rendered: show the live animation instead of the old video
  v.stale = !!(vt && o._at && o._at > vt);
  return v;
}
export function loadSite() {
  const texts = readTexts();
  const have = new Set(readJson(p('videos', 'manifest.json'), []));
  const stories = readData().map(d => storyView(d, texts)).map(v => ({ ...v, video: v.video && have.has(v.slug) }));
  return { stories, shots: readJson(p('shots', 'manifest.json'), {}), music: listMusic() };
}
