// Persian text of a story that can be edited from the site; saved into stories/texts.js on top of data.js.
export const FIELDS = [
  { k: 'fa', label: 'عنوان فارسی', type: 'line' },
  { k: 'desc', label: 'توضیحات', type: 'text' },
  { k: 'feats', label: 'ویژگی‌ها (هر خط یک ویژگی)', type: 'list', kinds: ['decor', 'rumi', 'board'] },
  { k: 'apps', label: 'کاربردها (هر خط یک کاربرد)', type: 'list', kinds: ['board'] },
];
export const EDITABLE_KINDS = ['decor', 'rumi', 'board'];

// decor stories have no feats in data.js: story.js shows these (the FUNDER / standard lines go into the seal band)
export const FEAT_DECOR = ['مقاوم در برابر سایش', 'مقاوم در برابر اسید', 'مقاوم در برابر لک', 'مقاوم در برابر حرارت',
  'مقاوم در برابر بخار', 'دوستدار محیط زیست'];

export const fieldsFor = kind => FIELDS.filter(f => !f.kinds || f.kinds.includes(kind));

// catalog value of a field (what the story shows without an edit)
export const origValue = (d, k) => (k === 'feats' && d.kind === 'decor' && !d.feats ? FEAT_DECOR : d[k]);

export function clean(type, v) {
  if (type === 'list') return (Array.isArray(v) ? v : String(v ?? '').split('\n')).map(x => String(x).replace(/\s+/g, ' ').trim()).filter(Boolean);
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}
export const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
