// متن‌های فارسی ویرایش‌شده‌ی استوری‌ها — روی متن کاتالوگ (data.js) نوشته می‌شوند و با ساخت دوباره‌ی data.js از بین نمی‌روند.
// از پنجره‌ی هر استوری در سایت (npm run dev) ویرایش می‌شود. _at زمان آخرین ویرایش است.
window.STORY_TEXTS = {
 "052-M193": {
  "fa": "پیترا خاکستری",
  "_at": 1791301188937
 }
};
(function () {
  const T = window.STORY_TEXTS;
  (window.STORY_DATA || []).forEach(d => { const o = T[d.slug]; if (o) ["fa", "desc", "feats", "apps"].forEach(k => { if (o[k] != null) d[k] = o[k]; }); });
})();
