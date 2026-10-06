// POST { slug, values: { fa, desc, feats, apps } } -> saves the story's Persian text into stories/texts.js.
// A value equal to the catalog text (or empty) removes that edit, so the story goes back to data.js.
import { readData, readTexts, writeTexts, storyView } from '../../../lib/store.js';
import { fieldsFor, origValue, clean, same, EDITABLE_KINDS } from '../../../lib/fields.js';

let lock = Promise.resolve();

export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: 'bad json' }, { status: 400 });
  const d = readData().find(x => x.slug === body.slug);
  if (!d || !EDITABLE_KINDS.includes(d.kind)) return Response.json({ error: 'unknown story' }, { status: 400 });
  const run = lock.then(() => {
    const texts = readTexts();
    const o = { ...(texts[d.slug] || {}) };
    delete o._at;
    for (const f of fieldsFor(d.kind)) {
      if (!(f.k in (body.values || {}))) continue;
      const v = clean(f.type, body.values[f.k]);
      if (!v.length || same(v, origValue(d, f.k))) delete o[f.k];
      else o[f.k] = v;
    }
    if (Object.keys(o).length) texts[d.slug] = { ...o, _at: Date.now() };
    else delete texts[d.slug];
    writeTexts(texts);
    return texts;
  });
  lock = run.catch(() => {});
  try {
    const texts = await run;
    return Response.json({ ok: true, story: storyView(d, texts) });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
