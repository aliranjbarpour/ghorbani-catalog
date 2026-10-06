'use client';
// Landing page: hero, filters and the grid of stories; the player modal has the shot stills,
// the Persian text editor and the video builder (song + «ساخت ویدیو» + download link).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fieldsFor } from '../lib/fields.js';

const FAMS = [
  ['all', 'همه'], ['brand', 'معرفی'], ['board', 'تخته‌ها و پانل‌ها'], ['wood', 'طرح چوب'], ['fantasy', 'فانتزی'],
  ['solid', 'رنگ‌های سالید'], ['metallic', 'متالیک'], ['rumi', 'رومی پنل'], ['new', 'جدید ۲۰۲۵']];
const BD = { new: 'جدید', top: 'Top', trendy: 'Trendy', exclusive: 'Exclusive' };
const DEFAULT_SONG = 'Background Clip Music - 36.mp3';
const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const pad = (n, w = 2) => String(n).padStart(w, '0');
const shotSrc = (p, i, small) => `/shots/${p.slug}/${pad(i + 1)}${small ? '-s' : ''}.jpg`;
const live = (p, from = 0) => `/stories/story.html?id=${p.slug}&mode=embed${from ? `&from=${from}` : ''}&k=${Date.now()}`;
const enc = s => s.split('/').map(encodeURIComponent).join('/');
const songName = s => s.replace(/\.[^.]+$/, '');
const DlIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11m0 0l-5-5m5 5l5-5M5 20h14" /></svg>;

export default function StoryBrowser({ stories: initial, shots: initialShots, music: initialMusic }) {
  const [stories, setStories] = useState(initial);
  const [shots, setShots] = useState(initialShots);
  const [music, setMusic] = useState(initialMusic);
  const [bust, setBust] = useState({});             // slug -> timestamp, after its main video was replaced
  const [fam, setFam] = useState('all');
  const [q, setQ] = useState('');
  const [openSlug, setOpenSlug] = useState(null);
  const dlg = useRef(null);

  const vid = p => `/videos/${p.slug}.mp4${bust[p.slug] ? `?v=${bust[p.slug]}` : ''}`;
  const pos = p => `/posters/${p.slug}.jpg${bust[p.slug] ? `?v=${bust[p.slug]}` : ''}`;

  const view = useMemo(() => stories.filter(p => {
    if (fam === 'new' && p.badge !== 'new') return false;
    if (!['all', 'new'].includes(fam) && p.family !== fam) return false;
    const s = q.trim().toLowerCase();
    return !s || [p.code, p.fa, p.en, p.famFa].join(' ').toLowerCase().includes(s);
  }), [stories, fam, q]);
  const cur = view.findIndex(p => p.slug === openSlug);
  const story = stories.find(p => p.slug === openSlug);

  const go = useCallback(d => { if (view.length) setOpenSlug(view[((cur < 0 ? 0 : cur) + d + view.length) % view.length].slug); }, [view, cur]);
  const close = () => setOpenSlug(null);

  useEffect(() => {
    const d = dlg.current;
    if (openSlug && !d.open) d.showModal();
    if (!openSlug && d.open) d.close();
  }, [openSlug]);
  useEffect(() => {
    const k = e => {
      if (!openSlug || e.target.matches('input,textarea,select')) return;
      if (e.key === 'ArrowLeft') go(1);
      if (e.key === 'ArrowRight') go(-1);
    };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [openSlug, go]);

  const update = s => setStories(list => list.map(p => (p.slug === s.slug ? s : p)));
  const replaced = slug => {
    setStories(list => list.map(p => (p.slug === slug ? { ...p, video: true, stale: false } : p)));
    setBust(b => ({ ...b, [slug]: Date.now() }));
    fetch('/shots/manifest.json').then(r => r.json()).then(setShots).catch(() => {});
  };

  // hero mosaic + stats
  const sw = useMemo(() => stories.filter(d => d.thumb).map(d => '/' + d.thumb), [stories]);
  const cnt = k => stories.filter(d => d.kind === k).length;

  return (
    <>
      <header className="hero">
        <div className="mosaic" aria-hidden="true">
          {Array.from({ length: 96 }, (_, i) => <i key={i} style={{ backgroundImage: `url('${sw[(i * 5) % sw.length]}')` }} />)}
        </div>
        <div className="veil" />
        <div className="wrap in">
          <div className="nav">
            <div className="b"><img src="/assets/img/brand/logo-light.png" alt="لوگوی بازرگانی قربانی" /><div><b>بازرگانی قربانی</b><small>عاملیت فروش گروه صنعتی پویا در شمالغرب کشور</small></div></div>
            <a className="ph" href="tel:04132378585"><span className="lat">041-32378585</span></a>
          </div>
          <h1>هر محصول، <em>یک استوری</em> کامل<br />با تمام اطلاعات کاتالوگ</h1>
          <p>استوری‌های عمودی ۹:۱۶ آماده‌ی اینستاگرام برای همه‌ی محصولات گروه صنعتی پویا و رومی پنل — با عکس دکور، ابعاد، ضخامت، هسته، فینیش‌ها و ویژگی‌ها.</p>
          <div className="stats">
            {[[stories.length, 'استوری'], [cnt('decor'), 'دکور پویا'], [cnt('rumi'), 'رنگ رومی پنل'], [cnt('board'), 'تخته و پانل']]
              .map(([n, t]) => <div key={t}><b>{n}</b><span>{t}</span></div>)}
          </div>
          <div className="acts"><a className="btn" href="#grid">مشاهده‌ی استوری‌ها</a></div>
        </div>
      </header>

      <div className="bar"><div className="wrap">
        <div className="chips" role="toolbar" aria-label="فیلتر دسته‌بندی">
          {FAMS.map(([k, t]) => {
            const n = k === 'all' ? stories.length : k === 'new' ? stories.filter(d => d.badge === 'new').length : stories.filter(d => d.family === k).length;
            return <button key={k} className="chip" aria-pressed={fam === k} onClick={() => setFam(k)}>{t}<small>{n}</small></button>;
          })}
        </div>
        <input className="search" type="search" placeholder="جستجوی کد یا نام… (مثلاً M213)" aria-label="جستجو" value={q} onChange={e => setQ(e.target.value)} />
      </div></div>

      <main className="wrap" id="grid">
        <div className="count">{fa(view.length)} استوری</div>
        <div className="grid">
          {view.map(p => {
            const ok = p.video;
            const code = p.kind === 'board' || p.code === 'GHORBANI' ? '' : p.code;
            const st = { backgroundImage: `url('${ok ? pos(p) : '/' + (p.thumb || p.board || 'assets/img/brand/logo-light.png')}')` };
            if (!ok && p.kind === 'board') Object.assign(st, { backgroundColor: '#efe6da', backgroundSize: '90% auto', backgroundRepeat: 'no-repeat' });
            if (!ok && p.kind === 'brand') Object.assign(st, { backgroundColor: '#3a1a16', backgroundSize: '62% auto', backgroundRepeat: 'no-repeat' });
            return (
              <article className="card" key={p.slug}>
                <div className="thumb" style={st} onClick={() => setOpenSlug(p.slug)}>
                  <span className="n">{pad(p.n, 3)}</span>{p.badge && <span className={`bd ${p.badge}`}>{BD[p.badge]}</span>}
                  {!ok && <><span className={`code ${code.length > 5 ? 'long' : ''}`}>{code}</span><span className="nm">{p.fa}</span></>}
                  <span className="play"><svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" /></svg></span>
                </div>
                <div className="meta"><div className="fam">{p.famFa}</div>
                  <div className="row">
                    <button className="btn" onClick={() => setOpenSlug(p.slug)}>▶ پخش</button>
                    {ok && <a className="btn ghost" href={vid(p)} download={`${p.slug}.mp4`} title="دانلود ویدیوی استوری">⬇ ویدیو</a>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <footer><div className="wrap">
        <b>بازرگانی قربانی</b> — عاملیت فروش گروه صنعتی پویا در شمالغرب کشور<br />
        تلفن: <span className="lat">041-32378585</span> · واتساپ: <span className="lat">0914-118-9071</span> · <span className="lat">BazarganiGhorbani.ir</span><br />
        تبریز، جاده تهران به سمت میدان بسیج، کوی صنعتی ایرداک، ایرداک اول غربی — بازرگانی قربانی<br />
        منبع اطلاعات: دیزاین‌بوک پویا ۲۰۲۵ و کاتالوگ رومی پنل کالکشن ۱۴۰۲
      </div></footer>

      <dialog ref={dlg} onCancel={e => { e.preventDefault(); close(); }}>
        <div className="mv" onClick={e => { if (e.target.classList.contains('mv')) close(); }}>
          <button className="close" onClick={close} aria-label="بستن">✕</button>
          <button className="nav2 prev" onClick={() => go(-1)} aria-label="قبلی">›</button>
          {story && <Player key={story.slug} p={story} shots={shots[story.slug] || []} vid={vid(story)} pos={pos(story)}
            music={music} setMusic={setMusic} onSaved={update} onReplaced={replaced} />}
          <button className="nav2 next" onClick={() => go(1)} aria-label="بعدی">‹</button>
        </div>
      </dialog>
    </>
  );
}

/* ---------- player modal: video / live story + side panel ---------- */
function Player({ p, shots, vid, pos, music, setMusic, onSaved, onReplaced }) {
  // the rendered video is shown unless the story text was edited after it was made
  const [frame, setFrame] = useState(() => (p.video && !p.stale ? { main: true } : { src: live(p) }));
  const vsrc = frame.main ? vid : frame.video;
  const [active, setActive] = useState(-1);
  const videoRef = useRef(null), iframeRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => {
      const w = iframeRef.current?.contentWindow;
      const t = videoRef.current ? videoRef.current.currentTime : w?.__time ? w.__time() : -1;
      let a = -1; if (t >= 0) shots.forEach((s, i) => { if (t >= s.from) a = i; });
      setActive(a);
    }, 300);
    return () => clearInterval(id);
  }, [shots]);

  const jump = from => {
    if (frame.main && videoRef.current) { videoRef.current.currentTime = from; videoRef.current.play(); }
    else setFrame({ src: live(p, from) });
  };
  const play = url => setFrame({ video: url });

  return (
    <>
      <div className="frame">
        {vsrc
          ? <video ref={videoRef} key={vsrc} src={vsrc} poster={frame.main ? pos : undefined} autoPlay controls playsInline loop />
          : <iframe ref={iframeRef} key={frame.src} src={frame.src} title={p.fa} />}
      </div>
      <div className="side">
        <h3>{p.fa}</h3>
        <div className="lat">{p.code === 'GHORBANI' ? '' : `${p.code} · `}{p.en}</div>
        {p.editable && <TextEditor p={p} onSaved={s => { onSaved(s); setFrame({ src: live(s) }); }} />}
        <Builder p={p} music={music} setMusic={setMusic} play={play} playing={vsrc}
          onReplaced={() => { onReplaced(p.slug); setFrame({ main: true }); }} />
        {p.video && <a className="btn dl" href={vid} download={`${p.slug}.mp4`}><DlIcon />دانلود ویدیوی اصلی استوری</a>}
        {p.stale && <div className="note">متن این استوری بعد از ساخت ویدیوی اصلی عوض شده؛ پیش‌نمایش زنده نمایش داده می‌شود.</div>}
        <div className="sh">{shots.length ? `${fa(shots.length)} شات — برای رفتن به هر شات کلیک کنید` : ''}</div>
        <div className="shots">
          {shots.map((s, i) => (
            <button className="shot" key={i} aria-current={i === active} onClick={e => { if (!e.target.closest('a')) jump(s.from); }}>
              <img src={shotSrc(p, i, true)} alt={s.label} loading="lazy" />
              <span>{fa(i + 1)}. {s.label}</span>
              <a href={shotSrc(p, i)} download={`${p.slug}-${pad(i + 1)}.jpg`} aria-label={`دانلود ${s.label}`} title="دانلود عکس با کیفیت کامل"><DlIcon /></a>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------- Persian text of the story ---------- */
function TextEditor({ p, onSaved }) {
  const fields = fieldsFor(p.kind);
  const asText = (f, v) => (f.type === 'list' ? (v || []).join('\n') : v || '');
  const initVals = () => Object.fromEntries(fields.map(f => [f.k, asText(f, p.edited[f.k] ? p[f.k] : p.orig[f.k])]));
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState(initVals);
  const [msg, setMsg] = useState({ t: '', err: false });
  const [busy, setBusy] = useState(false);
  const edited = Object.keys(p.edited || {}).length > 0;

  const save = async values => {
    setBusy(true);
    const r = await fetch('/api/texts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: p.slug, values }) })
      .then(r => r.json()).catch(() => ({ error: 'اتصال به سرور برقرار نشد' }));
    setBusy(false);
    if (r.error) return setMsg({ t: 'ذخیره نشد: ' + r.error, err: true });
    setOpen(false);
    onSaved(r.story);
    setMsg({ t: p.video ? 'ذخیره شد. پیش‌نمایش زنده با متن جدید پخش می‌شود؛ برای ویدیوی جدید از «ساخت ویدیو» استفاده کنید.' : 'ذخیره شد.', err: false });
  };
  const reset = () => save(Object.fromEntries(fields.map(f => [f.k, ''])));
  const begin = () => { setVals(initVals()); setOpen(true); setMsg({ t: '' }); };

  return (
    <div className="ed">
      <div className="hd">
        <span>متن فارسی استوری {edited && <span className="tag">ویرایش‌شده</span>}</span>
        {!open && <button className="lnk" onClick={begin}>✎ ویرایش</button>}
      </div>
      {open && <>
        {fields.map(f => {
          const v = vals[f.k];
          const orig = asText(f, p.orig[f.k]);
          const set = e => setVals(o => ({ ...o, [f.k]: e.target.value }));
          return (
            <div className="f" key={f.k}>
              <label className="lb" htmlFor={`ed-${f.k}`}>{f.label}{f.type !== 'list' && <em>{fa(v.trim().length)} حرف</em>}</label>
              {f.type === 'line'
                ? <input id={`ed-${f.k}`} className="t" dir="rtl" value={v} onChange={set} onKeyDown={e => { if (e.key === 'Enter') save(vals); }} />
                : <textarea id={`ed-${f.k}`} dir="rtl" rows={f.type === 'list' ? Math.min(8, v.split('\n').length + 1) : 3} value={v} onChange={set} />}
              {p.edited[f.k] && orig && <div className="orig">متن کاتالوگ: {f.type === 'list' ? orig.split('\n').join('، ') : orig}</div>}
            </div>
          );
        })}
        <div className="bt">
          <button className="btn" disabled={busy} onClick={() => save(vals)}>ذخیره</button>
          <button className="btn ghost" onClick={() => { setOpen(false); setMsg({ t: '' }); }}>انصراف</button>
          {edited && <button className="btn ghost" disabled={busy} onClick={reset}>متن کاتالوگ</button>}
        </div>
      </>}
      <div className={`msg${msg.err ? ' err' : ''}`}>{msg.t}</div>
    </div>
  );
}

/* ---------- build a video with a chosen song ---------- */
const STAGE = { prepare: 'آماده‌سازی استوری…', frames: 'ضبط فریم‌ها', encode: 'نهایی‌سازی ویدیو…', shots: 'ساخت عکس شات‌ها…', highlights: 'به‌روزرسانی هایلایت‌ها…' };
const lastSong = () => { try { return localStorage.getItem('story-song') || ''; } catch { return ''; } };

function Builder({ p, music, setMusic, play, playing, onReplaced }) {
  const [song, setSong] = useState(() => [lastSong(), DEFAULT_SONG].find(s => music.includes(s)) || music[0] || '');
  const [start, setStart] = useState(0);
  const [replace, setReplace] = useState(false);
  const [job, setJob] = useState(null);
  const [built, setBuilt] = useState([]);
  const [err, setErr] = useState('');
  const [upl, setUpl] = useState(false);
  const [listening, setListening] = useState(false);
  const audio = useRef(null);
  const prevState = useRef('');

  const refresh = useCallback(async () => {
    const r = await fetch(`/api/build?slug=${p.slug}`).then(r => r.json()).catch(() => null);
    if (!r) return;
    setBuilt(r.built);
    setJob(r.job);
    const was = prevState.current; prevState.current = r.job?.state || '';
    if (r.job?.state === 'done' && (was === 'running' || was === 'queued')) {
      if (r.job.replace) onReplaced();
      else play(r.job.url);
    }
  }, [p.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { refresh(); }, [refresh]);
  const active = job && (job.state === 'queued' || job.state === 'running');
  useEffect(() => {
    if (!active) return;
    const id = setInterval(refresh, 1500);
    return () => clearInterval(id);
  }, [active, refresh]);
  useEffect(() => () => audio.current?.pause(), []);

  const pick = s => { setSong(s); try { localStorage.setItem('story-song', s); } catch {} stopListen(); };
  const stopListen = () => { audio.current?.pause(); setListening(false); };
  const listen = () => {
    if (listening) return stopListen();
    const a = audio.current; if (!a || !song) return;
    a.src = `/music/${enc(song)}`;
    a.onloadedmetadata = () => { a.currentTime = Math.min(+start || 0, Math.max(0, a.duration - 1)); a.play(); };
    a.onended = () => setListening(false);
    setListening(true);
  };
  const upload = async e => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    setUpl(true); setErr('');
    const fd = new FormData(); fd.append('file', file);
    const r = await fetch('/api/music', { method: 'POST', body: fd }).then(r => r.json()).catch(() => ({ error: 'آپلود نشد' }));
    setUpl(false);
    if (r.error) return setErr(r.error);
    setMusic(r.music); pick(r.name);
  };
  const build = async () => {
    setErr(''); stopListen();
    const r = await fetch('/api/build', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: p.slug, music: song, start: +start || 0, replace }) }).then(r => r.json()).catch(() => ({ error: 'اتصال به سرور برقرار نشد' }));
    if (r.error) return setErr(r.error);
    prevState.current = r.job.state; setJob(r.job);
  };

  const pct = job ? Math.round(job.progress * 100) : 0;
  const status = !job ? '' : job.state === 'queued' ? `در صف ساخت${job.pos > 1 ? ` — نفر ${fa(job.pos)}` : ''}…`
    : job.state === 'running' ? (job.stage === 'frames' ? `${STAGE.frames}… ${fa(pct)}٪` : STAGE[job.stage] || 'در حال ساخت…') : '';
  const latest = job?.state === 'done' ? built.find(b => b.file === job.file) : null;

  return (
    <div className="ed">
      <div className="hd"><span>ساخت ویدیو</span><small>با آهنگ دلخواه</small></div>
      {music.length ? <>
        <div className="f">
          <label className="lb" htmlFor="song">آهنگ</label>
          <div className="row2">
            <select id="song" value={song} onChange={e => pick(e.target.value)} disabled={active}>
              {music.map(m => <option key={m} value={m}>{songName(m)}</option>)}
            </select>
            <button className="ib" onClick={listen} title={listening ? 'توقف' : 'گوش دادن به آهنگ'} aria-label="پیش‌نمایش آهنگ">{listening ? '❚❚' : '▶'}</button>
          </div>
        </div>
      </> : <div className="orig">هنوز آهنگی نیست — یک فایل صوتی اضافه کنید.</div>}
      <label className="up">{upl ? 'در حال آپلود…' : '+ افزودن آهنگ جدید'}<input type="file" accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.flac" onChange={upload} disabled={upl} /></label>
      <div className="sec">
        <label htmlFor="start">شروع آهنگ از ثانیه</label>
        <input id="start" type="number" min="0" step="1" value={start} onChange={e => setStart(e.target.value)} disabled={active} />
      </div>
      <label className="ck"><input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} disabled={active} />
        <span>جایگزین ویدیوی اصلی این استوری هم بشود (پوستر، عکس شات‌ها و هایلایت‌ها هم به‌روز می‌شوند)</span></label>
      {!active && <button className="btn go" onClick={build} disabled={!song}>🎬 ساخت ویدیو</button>}
      {active && <><div className="prog"><i style={{ width: `${job.state === 'queued' ? 0 : Math.max(3, pct)}%` }} /></div><div className="msg">{status} — حدود یک دقیقه طول می‌کشد.</div></>}
      {job?.state === 'error' && <div className="msg err">ساخت ویدیو خطا داد: {job.error}</div>}
      {err && <div className="msg err">{err}</div>}
      {latest && <>
        <div className="msg">ویدیو آماده است{job.warn ? ` (هشدار: ${job.warn})` : ''}.</div>
        <a className="btn" href={`${latest.url}?dl`} download={latest.file}><DlIcon />دانلود ویدیوی ساخته‌شده</a>
      </>}
      {built.length > 0 && <div className="built">
        <label className="lb">ویدیوهای ساخته‌شده <em>{fa(built.length)}</em></label>
        {built.slice(0, 6).map(b => (
          <div className={`it${playing === b.url ? ' on' : ''}`} key={b.file}>
            <div><b>{songName(b.music) || 'ویدیو'}</b><small>{b.at ? new Date(b.at).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' }) : ''} · {fa((b.size / 1048576).toFixed(1))} مگابایت</small></div>
            <button className="ib" onClick={() => play(b.url)} title="پخش" aria-label="پخش">▶</button>
            <a className="ib" href={`${b.url}?dl`} download={b.file} title="دانلود" aria-label="دانلود"><DlIcon /></a>
          </div>
        ))}
      </div>}
      <audio ref={audio} hidden />
    </div>
  );
}
