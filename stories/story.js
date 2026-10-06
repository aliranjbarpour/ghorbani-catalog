/* Story renderer: builds one 1080×1920 animated story for a product from data.js.
   ?id=<slug or n>   ?mode=render (frame-accurate seek for video export) | embed (fit + loop) */
(function () {
  const Q = new URLSearchParams(location.search);
  const DATA = window.STORY_DATA;
  const key = Q.get("id") || "1";
  const P = DATA.find(d => d.slug === key || String(d.n) === key || d.code === key) || DATA[0];
  const MODE = Q.get("mode") || "embed";
  const A = "../";
  const stage = document.getElementById("stage");
  if (MODE === "render") document.documentElement.classList.add("render");

  const CONTACT = {
    phone: "041-32378585", wa: "0914-118-9071", web: "BazarganiGhorbani.ir",
  };
  const BADGE = { new: "جدید ۲۰۲۵", top: "Top Decor · پرفروش", trendy: "Trendy · ترند", exclusive: "Exclusive · انحصاری" };
  if (P.kind === "board" && P.badge === "new") BADGE.new = "پنل جدید";
  if (P.kind === "rumi" && P.badge === "new") BADGE.new = "جدید";

  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const ltr = s => `<span class="ltr">${String(s).split(" | ").map(esc).join('<i class="sep"></i>')}</span>`;
  const url = p => `url("${A}${p}")`;
  const words = (s, cls) => { const d = h("div", cls); s.split(" ").forEach((w, i) => { if (i) d.appendChild(document.createTextNode(" ")); d.appendChild(h("span", "", esc(w))); }); return d; };
  const pn = n => String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
  stage.style.setProperty("--hex", P.hex || "#9a8270");

  const tl = gsap.timeline({ paused: true });
  const SHOTS = [];                                    // moments where each shot is fully on screen (for shot stills)
  const mark = (t, label, from) => SHOTS.push({ t: +t.toFixed(2), from: +from.toFixed(2), label });
  const E = { ease: "power3.out" };

  /* ---------- shared layers ---------- */
  const bgWrap = h("div", "layer"); stage.appendChild(bgWrap);
  const texture = P.kind === "brand" ? null : (P.swatch || null);
  let bg = null;
  if (texture) { bg = h("div", "bg"); bg.style.backgroundImage = url(texture); bgWrap.appendChild(bg); bgWrap.appendChild(h("div", "bg-shade")); }
  const dark = h("div", "bg-dark"); bgWrap.appendChild(dark);
  const light = h("div", "lightpanel"); light.style.opacity = 0; bgWrap.appendChild(light);

  const scenes = h("div", "layer"); stage.appendChild(scenes);
  const top = h("div", "top");
  const brandLabel = P.brand === "RUMI PANEL" ? "RUMI PANEL" : (P.brand === "POOYA TECH" ? "POOYA TECH" : "POOYA");
  top.innerHTML = `<div class="brandbox"><img class="logoL" src="${A}assets/img/brand/logo-light.png"><img class="logoD" src="${A}assets/img/brand/logo-dark.png" style="display:none"><div class="bt"><b>بازرگانی قربانی</b><span>عاملیت فروش گروه صنعتی پویا در شمالغرب کشور</span></div></div>${brandLabel === "RUMI PANEL" ? `<div class="mk">${brandLabel}</div>` : `<div class="pooya"><img class="pyW" src="${A}assets/img/brand/pooya-white.png" alt="POOYA"><img class="pyR" src="${A}assets/img/brand/pooya-red.png" alt="POOYA" style="display:none"></div>`}`;
  stage.appendChild(top);
  stage.appendChild(h("div", "grain"));
  const setTopDark = (on, t) => {
    tl.set(top, { color: on ? "#0d0e11" : "#f5f6f7" }, t);
    tl.set(top.querySelector(".logoL"), { display: on ? "none" : "block" }, t);
    tl.set(top.querySelector(".logoD"), { display: on ? "block" : "none" }, t);
    if (top.querySelector(".mk")) tl.set(top.querySelector(".mk"), { borderColor: on ? "rgba(13,14,17,.4)" : "rgba(245,246,247,.5)" }, t);
    if (top.querySelector(".pyW")) { tl.set(top.querySelector(".pyW"), { display: on ? "none" : "block" }, t); tl.set(top.querySelector(".pyR"), { display: on ? "block" : "none" }, t); }
  };
  const scene = cls => { const s = h("div", "layer " + (cls || "")); s.style.opacity = 0; scenes.appendChild(s); return s; };
  const out = (s, t, d = .5) => tl.to(s, { opacity: 0, y: -40, duration: d, ease: "power2.in" }, t);
  const show = (s, t) => tl.set(s, { opacity: 1, y: 0 }, t);

  /* ---------- scene builders ---------- */
  function hero(t0) {
    const s = scene();
    const isLongCode = P.code.length >= 5;
    const codeTxt = P.kind === "board" ? "" : P.code;
    const hz = h("div", "hero");
    if (codeTxt) {
      const c = h("div", "code" + (codeTxt.length >= 7 ? " xlong" : isLongCode ? " long" : ""));
      [...codeTxt].forEach(ch => c.appendChild(h("span", "", esc(ch))));
      hz.appendChild(c);
    }
    hz.appendChild(h("div", "fa-name" + (P.fa.length > 18 ? " small" : ""), esc(P.fa)));
    hz.appendChild(h("div", "en-name", esc(P.en)));
    const b = h("div", "badges");
    if (P.badge) b.appendChild(h("div", "badge b-" + P.badge, BADGE[P.badge]));
    (P.cols || [P.famFa]).slice(0, 2).forEach(c => b.appendChild(h("div", "badge ghost", esc(c))));
    hz.appendChild(b); s.appendChild(hz);
    show(s, t0);
    if (bg) tl.fromTo(bg, { scale: 1.28, rotation: .001 }, { scale: 1.06, duration: 7, ease: "sine.out" }, t0);
    tl.from(top, { y: -60, opacity: 0, duration: .9, ...E }, t0 + .1);
    if (codeTxt) tl.from(hz.querySelectorAll(".code span"), { yPercent: 110, opacity: 0, duration: 1.0, stagger: .07, ease: "expo.out" }, t0 + .25);
    tl.from(hz.querySelector(".fa-name"), { y: 50, opacity: 0, duration: .9, ...E }, t0 + .75);
    tl.from(hz.querySelector(".en-name"), { opacity: 0, letterSpacing: ".6em", duration: 1.1, ...E }, t0 + .95);
    tl.from(b.children, { y: 30, opacity: 0, scale: .9, duration: .6, stagger: .12, ease: "back.out(2)" }, t0 + 1.2);
    mark(t0 + 2.8, "معرفی", t0);
    return s;
  }

  function board3d(t0) {
    const s = scene();
    const spot = h("div", "spot"); s.appendChild(spot);
    const st = h("div", "stage3d");
    // each slab sits in a flat .rig that carries perspective + opacity: opacity on the preserve-3d slab itself
    // would flatten it, so the edges (thickness) would only snap in after the fade ends
    const mk = cls => { const rig = h("div", "rig"); const sl = h("div", "slab " + cls); const f = h("div", "face"); f.style.backgroundImage = url(texture); sl.appendChild(f);
      sl.appendChild(h("div", "edge-r core-mdf")); sl.appendChild(h("div", "edge-b core-mdf")); rig.appendChild(sl); return [rig, sl, f]; };
    const [backRig, back, backFace] = mk("back"); const [frontRig, front, face] = mk("front");
    const sheen = h("div", "sheen"); face.appendChild(sheen);
    const floor = h("div", "floor");
    st.appendChild(floor); st.appendChild(backRig); st.appendChild(frontRig); s.appendChild(st);
    // general info: one row per core format, every value large enough to read on a phone
    const parts = v => String(v).split(" | ");
    const dims = f => { const L = parts(f.len), W = parts(f.wid);
      return (W.length === 1 ? L.map(l => `${l} × ${W[0]}`) : [`${L.join(" / ")} × ${W.join(" / ")}`]).map(d => `<i>${esc(d)}</i>`).join(""); };
    const info = h("div", "info");
    info.innerHTML = `<div class="in-head"><div class="in-id"><b>${esc(P.fa)}</b><small>${esc((P.cols || [P.famFa]).join(" · "))}</small></div><div class="in-code lat">${esc(P.code)}</div></div>
      <div class="in-grid"><span>هسته</span><span>ابعاد ورق <em>mm</em></span><span>ضخامت <em>mm</em></span>` +
      P.formats.map(f => `<b class="c">${esc(f.fa)}</b><div class="c">${dims(f)}</div><div class="c">${parts(f.th).map(x => `<i>${esc(x)}</i>`).join("")}</div>`).join("") + `</div>`;
    s.appendChild(info);
    show(s, t0);
    tl.to(dark, { opacity: .95, duration: .8 }, t0 - .3);
    tl.from(spot, { opacity: 0, scale: .7, duration: 1.4, ease: "sine.out" }, t0);
    // sheets glide in from the right edge, nearly edge-on (thickness first), and turn toward the light while travelling;
    // the entrance ends at zero velocity and hands over to a slow turntable drift, so there is no snap anywhere
    const IN = 2.4, LEN = 5.0;
    tl.fromTo(frontRig, { opacity: 0 }, { opacity: 1, duration: .8, ease: "sine.out" }, t0);
    tl.fromTo(front, { x: 640, y: 30, z: -320, rotationY: -86, rotationX: 14 }, { x: 40, y: 0, z: 0, rotationY: -36, rotationX: 8, duration: IN, ease: "power2.out" }, t0);
    tl.to(front, { x: 22, y: -12, rotationY: -20, rotationX: 4, duration: LEN - IN, ease: "sine.inOut" }, t0 + IN);
    tl.fromTo(face, { filter: "brightness(.4)" }, { filter: "brightness(1)", duration: IN, ease: "power1.out" }, t0);
    tl.fromTo(backRig, { opacity: 0 }, { opacity: 1, duration: .9, ease: "sine.out" }, t0 + .2);
    tl.fromTo(back, { x: 600, y: 20, z: -620, rotationY: -82, rotationX: 13 }, { x: -150, y: 0, z: -220, rotationY: -34, rotationX: 9, duration: IN + .1, ease: "power2.out" }, t0 + .2);
    tl.to(back, { x: -170, y: -6, rotationY: -26, rotationX: 7, duration: LEN - IN - .3, ease: "sine.inOut" }, t0 + IN + .3);
    tl.fromTo(backFace, { filter: "brightness(.22) saturate(.9)" }, { filter: "brightness(.62) saturate(.9)", duration: IN, ease: "power1.out" }, t0 + .2);
    tl.fromTo(floor, { x: 460, opacity: 0, scaleX: .35 }, { x: 0, opacity: 1, scaleX: 1, duration: IN, ease: "power2.out" }, t0 + .1);
    tl.fromTo(sheen, { left: "-60%" }, { left: "130%", duration: 2.0, ease: "power2.inOut" }, t0 + 1.1);
    tl.from(info, { y: 90, opacity: 0, duration: .9, ...E }, t0 + 1.0);
    tl.from(info.querySelectorAll(".in-head > *"), { opacity: 0, y: 20, duration: .5, stagger: .1, ...E }, t0 + 1.25);
    tl.from(info.querySelectorAll(".in-grid > *"), { opacity: 0, y: 24, duration: .5, stagger: .06, ...E }, t0 + 1.45);
    tl.from(info.querySelectorAll(".in-grid i"), { opacity: 0, scale: .6, duration: .35, stagger: .03, ease: "back.out(2.2)" }, t0 + 1.7);
    mark(t0 + 4.4, "ورق و ابعاد", t0);
    return s;
  }

  function decorScene(t0) {
    const s = scene();
    if (P.interior) {
      const ph = h("div", "photo"); const im = h("div", "img"); im.style.backgroundImage = url(P.interior);
      ph.appendChild(im); s.appendChild(ph);
      const sw = h("div", "chipsw"); sw.style.backgroundImage = url(texture); s.appendChild(sw);
      s.appendChild(h("div", "chipsw-lab", esc(P.code)));
      const d = words(P.desc, "desc"); s.appendChild(d);
      show(s, t0);
      tl.fromTo(ph, { clipPath: "inset(0% 0% 0% 100% round 36px)" }, { clipPath: "inset(0% 0% 0% 0% round 36px)", duration: 1.1, ease: "expo.inOut" }, t0);
      tl.fromTo(im, { scale: 1.25 }, { scale: 1.04, duration: 4.2, ease: "sine.out" }, t0);
      tl.from(sw, { scale: 0, rotation: -90, duration: .8, ease: "back.out(1.6)" }, t0 + .8);
      tl.from(s.querySelector(".chipsw-lab"), { opacity: 0, y: 20, duration: .5 }, t0 + 1.2);
      tl.from(d.children, { opacity: 0, y: 26, duration: .45, stagger: .045, ...E }, t0 + 1.0);
      mark(t0 + 4.2, "در دکوراسیون", t0);
    } else {
      const c = h("div", "swcard"); const im = h("div", "img"); im.style.backgroundImage = url(texture); c.appendChild(im); s.appendChild(c);
      const lens = h("div", "lens"); lens.style.backgroundImage = url(texture); lens.style.backgroundSize = "1800px auto"; s.appendChild(lens);
      const hx = h("div", "hexrow", `<i></i><span>رنگ غالب</span><span class="lat" style="font-weight:500;letter-spacing:.08em">${esc(P.hex || "")}</span>`); s.appendChild(hx);
      const d = words(P.desc, "desc wide"); d.style.top = "1410px"; s.appendChild(d);
      show(s, t0);
      tl.fromTo(c, { clipPath: "inset(100% 0% 0% 0% round 40px)" }, { clipPath: "inset(0% 0% 0% 0% round 40px)", duration: 1.1, ease: "expo.inOut" }, t0);
      tl.fromTo(im, { scale: 1.2 }, { scale: 1.0, duration: 4, ease: "sine.out" }, t0);
      tl.fromTo(lens, { left: 560, top: 620, scale: 0 }, { scale: 1, duration: .7, ease: "back.out(1.7)" }, t0 + .9);
      tl.to(lens, { left: 220, top: 900, duration: 2.4, ease: "sine.inOut" }, t0 + 1.4);
      tl.fromTo(lens, { backgroundPosition: "30% 20%" }, { backgroundPosition: "70% 70%", duration: 3, ease: "sine.inOut" }, t0 + .9);
      tl.from(hx.children, { opacity: 0, y: 20, duration: .5, stagger: .1 }, t0 + .9);
      tl.from(d.children, { opacity: 0, y: 26, duration: .45, stagger: .045, ...E }, t0 + 1.2);
      mark(t0 + 4.2, "بافت سطح", t0);
    }
    return s;
  }

  /* ---------- spec shots: one elegant table per shot, held long enough to read ---------- */
  const chips = v => `<span class="ltr chips">${String(v).split(" | ").map(x => `<i>${esc(x)}</i>`).join("")}</span>`;
  const FEAT_DECOR = ["مقاوم در برابر سایش", "مقاوم در برابر اسید", "مقاوم در برابر لک", "مقاوم در برابر حرارت", "مقاوم در برابر بخار", "دوستدار محیط زیست", "تحت لیسانس فوندر (FUNDER)", "مطابق استانداردهای اروپایی"];
  // 24×24 line icons for the feature tiles, picked by keyword
  const ICONS = [
    [/سایش/, '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M12 21 8 9l4-6 4 6z"/>'],
    [/اسید/, '<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/>'],
    [/لک|نگهداری/, '<path d="M12 3 14 9l6 2-6 2-2 6-2-6-6-2 6-2z"/><path d="M19 3v4M17 5h4"/>'],
    [/حرارت/, '<path d="M12 22c4 0 7-3 7-7 0-5-5-6-5-12-3 2-4 5-4 8-1-1-2-2-2-4-2 2-3 5-3 8 0 4 3 7 7 7z"/><path d="M12 22c-2 0-3-1.5-3-3.5S12 14 12 14s3 2.5 3 4.5-1 3.5-3 3.5z"/>'],
    [/بخار|رطوبت/, '<path d="M8 3c-1.5 1.5 1.5 3 0 4.5M12 3c-1.5 1.5 1.5 3 0 4.5M16 3c-1.5 1.5 1.5 3 0 4.5"/><path d="M3 11h18v2a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8z"/>'],
    [/محیط زیست|آلاینده/, '<path d="M5 19c0-9 6-14 15-15 0 9-5 15-14 15"/><path d="M5 19 13 11"/>'],
    [/میکروب/, '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 9v6M9 12h6"/>'],
    [/غذایی/, '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 21V3c-2.5 1-4 4-4 8h4"/>'],
    [/ماشین|فرز/, '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'],
    [/درخشندگی/, '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>'],
    [/تنوع/, '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>'],
    [/کفپوش|سطح|سنباده/, '<path d="M3 8 12 4l9 4-9 4z"/><path d="M3 12l9 4 9-4M3 16l9 4 9-4"/>'],
    [/FUNDER|استاندارد/, '<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>'],
  ];
  const featIcon = f => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${
    (ICONS.find(([re]) => re.test(f)) || [, '<path d="M5 12.5 10 17 19 7"/>'])[1]}</svg>`;
  function diagram(f) {
    const first = v => String(v).split(" | ")[0].replace(/[–-].*/, "");
    const L = +first(f.len), Wd = +first(f.wid), th = String(f.th).split(" | ");
    const w = 540, hgt = Math.min(330, Math.round(540 * Wd / L));
    const face = texture ? `background-image:${url(texture).replace(/"/g, "'")}` : "background:#c8a57a";
    return `<div class="dia"><div class="dsheet" style="width:${w}px;height:${hgt}px;${face}"><span class="edge"></span></div>
      <div class="dl dl-l" style="width:${w}px"><i></i><b class="ltr">${esc(f.len.replace(/ \| /g, " / "))}</b><i></i></div>
      <div class="dl dl-w" style="height:${hgt}px"><i></i><b class="ltr">${esc(f.wid.replace(/ \| /g, " / "))}</b><i></i></div>
      <div class="dl dl-t">ضخامت: <b class="ltr">${esc(th[0])}</b>${th.length > 1 ? ` تا <b class="ltr">${esc(th[th.length - 1])}</b>` : ""} میلی‌متر</div></div>`;
  }
  function specCard(s, title, sub) {
    const c = h("div", "spec");
    const sw = texture ? `<div class="sp-sw" style="background-image:${url(texture).replace(/"/g, "'")}"></div>` : "";
    const code = P.kind === "board" ? "" : `<div class="sp-code">${esc(P.code)}</div>`;
    c.innerHTML = `<div class="sp-head">${sw}<div class="sp-id"><b>${esc(P.fa)}</b><small class="lat">${esc(P.en)}</small></div>${code}</div>
      <div class="sp-title"><h4>${title}</h4>${sub ? `<span>${sub}</span>` : ""}</div><div class="sp-body"></div>
      <div class="sp-foot"><span>${P.kind === "rumi" ? esc(P.maker || "") : "گروه صنعتی پویا · تکنولوژی آلمان"}</span></div>
      <div class="hold"><i></i></div>`;
    s.appendChild(c); return c;
  }
  function shot(t0, title, sub, bodyHtml, rows, opts = {}) {
    const s = scene();
    const c = specCard(s, title, sub);
    c.querySelector(".sp-body").innerHTML = bodyHtml;
    if (opts.compact) c.classList.add("compact");
    const hold = 3.2 + rows * 0.42;                 // reading time grows with the amount of content
    const dur = 1.2 + hold;
    show(s, t0);
    tl.fromTo(c, { xPercent: -108, rotation: -2 }, { xPercent: 0, rotation: 0, duration: .9, ease: "expo.out" }, t0);
    tl.from(c.querySelectorAll(".sp-head > *"), { opacity: 0, y: 20, duration: .5, stagger: .08, ...E }, t0 + .35);
    tl.from(c.querySelector(".sp-title"), { opacity: 0, x: 40, duration: .6, ...E }, t0 + .45);
    const items = c.querySelectorAll(".lux tr, .ftile, .fgrid > div");
    const dia = c.querySelector(".dia");
    if (dia) { tl.from(dia.querySelector(".dsheet"), { scaleX: 0, transformOrigin: "right", duration: .9, ease: "expo.out" }, t0 + .9);
      tl.from(dia.querySelectorAll(".dl"), { opacity: 0, duration: .5, stagger: .15 }, t0 + 1.5); }
    tl.from(items, { opacity: 0, y: 34, duration: .55, stagger: Math.min(.16, 1.6 / Math.max(items.length, 1)), ...E }, t0 + .6);
    tl.from(c.querySelectorAll(".ft-ic"), { scale: 0, rotation: -40, duration: .5, stagger: Math.min(.16, 1.6 / Math.max(items.length, 1)), ease: "back.out(2.4)" }, t0 + .75);
    const seals = c.querySelector(".seals");
    if (seals) { tl.from(seals, { opacity: 0, y: 40, duration: .6, ...E }, t0 + 1.5);
      tl.from(seals.children, { opacity: 0, y: 16, duration: .45, stagger: .12, ...E }, t0 + 1.75); }
    tl.from(c.querySelectorAll(".chips i"), { opacity: 0, scale: .5, duration: .35, stagger: .025, ease: "back.out(2.2)" }, t0 + .95);
    tl.fromTo(c.querySelector(".hold i"), { scaleX: 0 }, { scaleX: 1, duration: dur - .3, ease: "none" }, t0 + .3);
    tl.to(c, { xPercent: 108, rotation: 2, duration: .6, ease: "power3.in" }, t0 + dur);
    tl.set(s, { opacity: 0 }, t0 + dur + .6);
    mark(t0 + dur - .3, opts.label || title, t0);
    return t0 + dur + .45;
  }
  function specShots(t0) {
    let t = t0;
    const o = extra => Object.assign({}, extra);
    setTopDark(false, t0);
    // 1 — dimensions
    const dims = `<table class="lux"><tr><th>هسته</th><th>طول</th><th>عرض</th><th>ضخامت</th></tr>` +
      P.formats.map(f => `<tr><td><b>${esc(f.fa)}</b><small class="lat">${esc(f.core)}</small></td><td>${chips(f.len)}</td><td>${chips(f.wid)}</td><td>${chips(f.th)}</td></tr>`).join("") +
      `</table>` + (P.formats.length <= 2 ? diagram(P.formats[0]) : `<p class="unit">همه‌ی اعداد به میلی‌متر</p>`);
    t = shot(t, "ابعاد و ضخامت", "Format [mm]", dims, P.formats.length * 2 + 2, o({ compact: P.formats.length > 2, label: "ابعاد و ضخامت" }));
    // 2 — finishes (only when there is a real list)
    if (P.fins && P.fins.length > 1) {
      const fins = P.fins.length > 6
        ? `<div class="fgrid">` + P.fins.map(f => `<div><span class="fcode">${esc(f.c)}</span><p><b>${esc(f.fa)}</b><small class="lat">${esc(f.en)}</small></p></div>`).join("") + `</div>`
        : `<table class="lux fins-t"><tr><th>کد</th><th>فینیش</th><th>Finish</th></tr>` +
          P.fins.map(f => `<tr><td><span class="fcode">${esc(f.c)}</span></td><td><b>${esc(f.fa)}</b></td><td class="lat en">${esc(f.en)}</td></tr>`).join("") + `</table>`;
      t = shot(t, "فینیش‌های قابل ارائه", "", fins, P.fins.length, o({ label: "فینیش‌ها" }));
    }
    // 3 — product identity
    const rows = [];
    if (P.kind !== "board") rows.push(["کد محصول", `<span class="lat big">${esc(P.code)}</span>`]);
    rows.push(["نام محصول", `<b>${esc(P.fa)}</b>`], ["نام لاتین", `<span class="lat">${esc(P.en)}</span>`]);
    rows.push(["برند", P.kind === "rumi" ? "رومی پنل — " + esc(P.maker || "") : P.brand === "POOYA TECH" ? "پویا تک — تخته‌های خام پویا" : "پویا دیزاین — گروه صنعتی پویا"]);
    if (P.cols || P.famFa) rows.push(["کالکشن", esc((P.cols || [P.famFa]).join(" · "))]);
    if (P.fins && P.fins.length === 1) rows.push(["سطح", `${esc(P.fins[0].fa)} <span class="lat muted">${esc(P.fins[0].en)}</span>`]);
    if (P.hex && P.kind !== "board") rows.push(["رنگ غالب", `<i class="dot"></i><span class="lat">${esc(P.hex)}</span>`]);
    rows.push(["هسته", esc([...new Set(P.formats.map(f => f.fa))].join(" / "))]);
    rows.push(["کاربرد", esc(P.apps ? P.apps.join("، ") : "مبلمان و دکوراسیون داخلی")]);
    if (P.page) rows.push(["مرجع", `${P.kind === "rumi" ? "کاتالوگ رومی پنل ۱۴۰۲" : "دیزاین‌بوک پویا ۲۰۲۵"} · صفحه ${pn(P.page)}`]);
    const idt = `<table class="lux kv">` + rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("") + `</table>`;
    t = shot(t, "شناسنامه‌ی محصول", "", idt, rows.length, o({ compact: rows.length > 8 }));
    // 4 — features
    // licence / standard lines move into the seal band, the rest become icon tiles
    const isSeal = f => /FUNDER|استاندارد/.test(f);
    const feats = (P.feats || FEAT_DECOR).filter(f => P.kind !== "decor" || !isSeal(f));
    const tile = (f, i) => { const m = f.match(/^(مقاوم در برابر|مقاوم به)\s+(.+)$/);
      return `<div class="ftile"><div class="ft-top"><span class="ft-ic">${featIcon(f)}</span><span class="ft-n lat">${String(i + 1).padStart(2, "0")}</span></div>
        <div class="ft-txt">${m ? `<small>${m[1]}</small><b>${esc(m[2])}</b>` : `<b>${esc(f)}</b>`}</div></div>`; };
    const seal = P.kind !== "decor" ? "" : `<div class="seals">
      <div><b class="lat">FUNDER</b><small>تحت لیسانس</small></div>
      <div><b class="lat">EU</b><small>کاغذ دکور و استاندارد اروپایی</small></div>
      <div><b class="lat">WEMHONER</b><small>خط پرس</small></div></div>`;
    const fh = `<div class="ftiles${feats.length <= 4 ? " few" : ""}">${feats.map(tile).join("")}</div>${seal}`;
    t = shot(t, P.kind === "decor" ? "ویژگی‌ها و استانداردها" : "ویژگی‌های محصول", P.kind === "decor" ? "Features" : "", fh, Math.ceil(feats.length / 2) + 1, o());
    return t;
  }

  function ctaScene(t0) {
    const s = scene();
    const c = h("div", "cta");
    c.innerHTML = `<div class="codechip">${esc(P.kind === "brand" ? "POOYA · RUMI PANEL" : P.code)}</div>
      <img class="logo" src="${A}assets/img/brand/logo-light.png">
      <h2>بازرگانی قربانی</h2><p class="sub">عاملیت فروش گروه صنعتی پویا در شمالغرب کشور</p>
      <div class="ask">موجودی و قیمت روز را از ما بپرسید</div>
      <div class="contacts"><div>${ltr(CONTACT.phone)}<small>تلفن</small></div><div>${ltr(CONTACT.wa)}<small>واتساپ</small></div></div>
      <div class="web">${CONTACT.web}</div>`;
    s.appendChild(c);
    tl.to(s, { opacity: 1, duration: .6 }, t0);
    tl.to(top, { opacity: 0, duration: .4 }, t0);
    tl.from(c.querySelector(".logo"), { scale: .6, opacity: 0, duration: 1, ease: "expo.out" }, t0 + .1);
    tl.from(c.querySelectorAll("h2,.sub,.ask,.contacts>div,.web,.codechip"), { y: 40, opacity: 0, duration: .6, stagger: .08, ...E }, t0 + .35);
    mark(t0 + 2.6, "تماس", t0);
    return s;
  }

  /* ---------- board (raw/white panels) ---------- */
  // quick facts for the board intro, straight from the format table
  function boardStats() {
    const nums = P.formats.flatMap(f => String(f.th).split(/[|–-]/).map(x => +x.trim()).filter(Boolean));
    const lens = P.formats.flatMap(f => String(f.len).split(/[|–-]/).map(x => +x.trim()).filter(Boolean));
    const cores = [...new Set(P.formats.map(f => f.core))];
    const mn = Math.min(...nums), mx = Math.max(...nums);
    return [
      [mn === mx ? `${mx}` : `${mn}–${mx}`, "mm", "ضخامت"],
      [`${Math.max(...lens)}`, "mm", "حداکثر طول ورق"],
      [cores.join(" · "), "", cores.length > 1 ? "هسته‌ها" : "هسته"],
    ];
  }
  const APP_ICONS = [
    [/کابینت حمام/, '<path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M8 20l-1 2M16 20l1 2"/>'],
    [/آشپزخانه|کابینت/, '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 10h18M12 10v11M9 14v2M15 14v2M7 6.5h3"/>'],
    [/درب/, '<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18"/><circle cx="15" cy="12.5" r=".9" fill="currentColor"/>'],
    [/ساختمان/, '<path d="M4 21V8l8-5 8 5v13M2 21h20"/><path d="M9 21v-6h6v6M9 10h.01M15 10h.01"/>'],
    [/کفپوش/, '<path d="M3 8 12 4l9 4-9 4z"/><path d="M3 12l9 4 9-4M3 16l9 4 9-4"/>'],
    [/مبلمان|دکوراسیون/, '<path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/><path d="M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v4H3z"/><path d="M5 17v3M19 17v3"/>'],
  ];
  const appIcon = a => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${
    (APP_ICONS.find(([re]) => re.test(a)) || APP_ICONS[APP_ICONS.length - 1])[1]}</svg>`;
  // Latin terms and standards in the copy (WEMHONER, E1, ISO 16895 …) get an accent
  const richDesc = txt => { const d = h("div", "bd-desc");
    txt.split(" ").forEach((w, i) => { if (i) d.appendChild(document.createTextNode(" "));
      d.appendChild(h("span", "", esc(w).replace(/[A-Za-z][A-Za-z0-9.+\-]*/g, m => `<em class="hl lat">${m}</em>`))); });
    return d; };

  function boardHero(t0) {
    const s = scene("bh");
    setTopDark(false, 0);
    tl.set(dark, { opacity: 1 }, 0);
    const spot = h("div", "bh-spot"); s.appendChild(spot);
    const wm = h("div", "bh-wm lat", esc(P.code)); wm.style.fontSize = Math.min(250, Math.round(1500 / P.code.length)) + "px"; s.appendChild(wm);
    const floor = h("div", "bh-floor"); s.appendChild(floor);
    const im = h("div", "bh-img"); im.innerHTML = `<img src="${A}${P.board}?v=2">`; s.appendChild(im);
    const tx = h("div", "bh-txt");
    tx.innerHTML = `<div class="bh-eyebrow"><i></i><span class="lat">${esc(P.brand)}</span>${P.badge ? `<em class="badge b-${P.badge}">${BADGE[P.badge]}</em>` : ""}</div>
      <h1${P.fa.length > 26 ? ' class="long"' : ""}>${esc(P.fa)}</h1><div class="bh-en lat">${esc(P.en)}</div>`;
    s.appendChild(tx);
    const st = h("div", "bh-stats");
    st.innerHTML = boardStats().map(([v, u, l]) => `<div><b class="lat">${esc(v)}${u ? `<small>${u}</small>` : ""}</b><span>${l}</span></div>`).join("");
    s.appendChild(st);
    show(s, t0);
    tl.from(top, { y: -60, opacity: 0, duration: .9, ...E }, t0 + .1);
    tl.from(spot, { opacity: 0, scale: .6, duration: 1.4, ease: "sine.out" }, t0);
    tl.from(wm, { opacity: 0, letterSpacing: "0.3em", duration: 1.6, ...E }, t0 + .1);
    tl.from(im, { x: 380, y: -40, rotation: 5, opacity: 0, duration: 1.4, ease: "expo.out" }, t0 + .25);
    tl.from(floor, { opacity: 0, scaleX: .4, duration: 1.2, ease: "expo.out" }, t0 + .5);
    tl.to(im, { y: -14, duration: 2.4, ease: "sine.inOut" }, t0 + 1.6);
    tl.to(floor, { scaleX: .92, opacity: .8, duration: 2.4, ease: "sine.inOut" }, t0 + 1.6);
    tl.from(tx.querySelector(".bh-eyebrow i"), { scaleX: 0, transformOrigin: "right", duration: .6, ...E }, t0 + .7);
    tl.from(tx.querySelectorAll(".bh-eyebrow span, .bh-eyebrow em, h1, .bh-en"), { y: 40, opacity: 0, duration: .8, stagger: .12, ...E }, t0 + .75);
    tl.from(st, { y: 50, opacity: 0, duration: .8, ...E }, t0 + 1.3);
    tl.from(st.children, { opacity: 0, y: 18, duration: .5, stagger: .1, ...E }, t0 + 1.5);
    mark(t0 + 3.2, "معرفی", t0);
    return s;
  }
  function boardDesc(t0) {
    const s = scene("bd");
    const im = h("div", "bd-img"); im.innerHTML = `<img src="${A}${P.board}?v=2">`; s.appendChild(im);
    const head = h("div", "bd-head"); head.innerHTML = `<i></i><b>درباره‌ی محصول</b><span class="lat">About</span>`; s.appendChild(head);
    const d = richDesc(P.desc); s.appendChild(d);
    const ap = h("div", "bd-apps");
    ap.innerHTML = `<div class="bd-sub"><b>کاربردها</b><span class="lat">Applications</span></div>
      <div class="bd-cards n${Math.min(P.apps.length, 3)}">${P.apps.map(a => `<div><span class="ic">${appIcon(a)}</span><b>${esc(a)}</b></div>`).join("")}</div>`;
    s.appendChild(ap);
    show(s, t0);
    tl.from(im, { x: -260, opacity: 0, duration: 1.1, ease: "expo.out" }, t0);
    tl.to(im, { x: -24, duration: 4.4, ease: "sine.inOut" }, t0 + 1.1);
    tl.from(head.children, { opacity: 0, x: 40, duration: .6, stagger: .1, ...E }, t0 + .35);
    tl.from(d.children, { opacity: 0, y: 26, duration: .45, stagger: Math.min(.05, 1.6 / d.children.length), ...E }, t0 + .55);
    tl.from(ap.querySelector(".bd-sub"), { opacity: 0, y: 20, duration: .5, ...E }, t0 + 1.7);
    tl.from(ap.querySelectorAll(".bd-cards > div"), { opacity: 0, y: 40, scale: .92, duration: .6, stagger: .12, ease: "back.out(1.8)" }, t0 + 1.85);
    tl.from(ap.querySelectorAll(".ic"), { scale: 0, rotation: -30, duration: .5, stagger: .12, ease: "back.out(2.4)" }, t0 + 2.05);
    mark(t0 + 4.8, "توضیحات و کاربرد", t0);
    return s;
  }

  /* ---------- brand intro ---------- */
  function brandIntro() {
    const swatches = DATA.filter(d => d.thumb).map(d => d.thumb);
    const s1 = scene();
    const mos = h("div", "mosaic");
    for (let i = 0; i < 66; i++) { const c = h("div"); c.style.backgroundImage = url(swatches[(i * 7) % swatches.length]); mos.appendChild(c); }
    s1.appendChild(mos); s1.appendChild(h("div", "intro-veil"));
    const hz = h("div", "hero"); hz.style.top = "620px";
    hz.innerHTML = `<img src="${A}assets/img/brand/logo-light.png" style="width:380px"><div class="fa-name" style="margin-top:30px">بازرگانی قربانی</div><div class="en-name">GHORBANI TRADING · TABRIZ</div>
      <div class="badges"><div class="badge">عاملیت فروش گروه صنعتی پویا در شمالغرب کشور</div></div>`;
    s1.appendChild(hz);
    show(s1, 0);
    tl.fromTo(mos, { scale: 1.6, rotation: -12 }, { scale: 1.3, rotation: -6, duration: 9, ease: "sine.out" }, 0);
    tl.from(mos.children, { opacity: 0, scale: .4, duration: .6, stagger: { each: .02, from: "center" }, ease: "back.out(1.5)" }, 0);
    tl.from(top, { y: -60, opacity: 0, duration: .9, ...E }, .3);
    tl.from(hz.children, { y: 50, opacity: 0, duration: .9, stagger: .15, ...E }, .6);
    mark(3.4, "معرفی", 0);
    tl.to(hz, { y: -380, scale: .82, duration: 1, ease: "power3.inOut" }, 4.0);
    tl.to(hz.querySelector(".badges"), { opacity: 0, duration: .4 }, 4.0);
    const count = k => DATA.filter(d => d.kind === k).length;
    const cats = h("div", "cats");
    cats.innerHTML = [
      ["پانل‌های دکوراتیو پویا", "طرح چوب · فانتزی · سالید · متالیک", count("decor")],
      ["رومی پنل — هایگلاس و سافت‌تاچ", "پانل PVC با مغز ام‌دی‌اف پارکو", count("rumi")],
      ["تخته‌ها و پانل‌های پویا", "نئوپان و ام‌دی‌اف خام، ملامینه، آکواگارد، اچ‌دی‌اف پلاس", count("board")],
    ].map(([a, b, n]) => `<div class="cat"><div><b>${a}</b><small>${b}</small></div><div class="n">${n}</div></div>`).join("");
    s1.appendChild(cats);
    cats.style.top = "1000px";
    tl.from(cats.children, { x: -120, opacity: 0, duration: .8, stagger: .18, ...E }, 4.5);
    tl.from(cats.querySelectorAll(".n"), { textContent: 0, snap: { textContent: 1 }, duration: 1.4, stagger: .18, ease: "power2.out" }, 4.6);
    const note = h("div", "desc wide", "هر محصول، یک استوری کامل با اطلاعات کاتالوگ"); note.style.top = "1560px"; note.style.fontSize = "38px"; s1.appendChild(note);
    tl.from(note, { opacity: 0, y: 20, duration: .6 }, 6.2);
    mark(8.8, "محصولات", 4.0);
    out(s1, 9.4);
    ctaScene(9.6);
    return 12.2;
  }

  /* ---------- assemble ---------- */
  let END;
  if (P.kind === "brand") END = brandIntro();
  else if (P.kind === "board") {
    const a = boardHero(0); out(a, 4.0);
    const b = boardDesc(4.3); out(b, 9.6);
    tl.to(dark, { opacity: .95, duration: .5 }, 9.6);
    const t = specShots(10.0);
    ctaScene(t + .2); END = t + 3.4;
  } else {
    const a = hero(0); out(a, 3.8);
    const b = board3d(4.1); out(b, 9.1);
    const c = decorScene(9.4); out(c, 14.2);
    tl.to(dark, { opacity: .96, duration: .5 }, 14.2);
    const t = specShots(14.6);
    ctaScene(t + .2); END = t + 3.4;
  }
  tl.to({}, { duration: 0.01 }, END - .01);

  /* ---------- run ---------- */
  function fit() { const s = Math.min(innerWidth / 1080, innerHeight / 1920); stage.style.transform = `scale(${s})`; }
  async function ready() {
    const imgs = [...stage.querySelectorAll("img")].map(i => i.decode().catch(() => {}));
    const bgs = [...new Set([...stage.querySelectorAll("[style*='url(']")].map(e => (e.style.backgroundImage.match(/url\("?([^")]+)"?\)/) || [])[1]).filter(Boolean))]
      .map(u => new Promise(r => { const im = new Image(); im.onload = im.onerror = () => im.decode ? im.decode().then(r, r) : r(); im.src = u; }));
    await Promise.all([document.fonts.ready, ...imgs, ...bgs,
      document.fonts.load("900 40px Yekan"), document.fonts.load("200 40px Outfit"), document.fonts.load("300 40px Outfit")]);
  }
  window.__duration = END;
  window.__shots = SHOTS.sort((a, b) => a.t - b.t);
  window.__seek = t => { tl.seek(t, false); };
  window.__time = () => tl.time();
  ready().then(() => {
    window.__ready = true;
    if (MODE === "render") { tl.seek(0); return; }
    fit(); addEventListener("resize", fit);
    if (Q.get("t")) { tl.seek(+Q.get("t")); return; }
    tl.play(+Q.get("from") || 0); tl.eventCallback("onComplete", () => setTimeout(() => tl.play(0), 400));
  });
})();
