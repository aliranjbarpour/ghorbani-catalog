# Copies the rendered story videos into highlights/<category>/NN-<code>.mp4 (in publishing order)
# and rewrites highlights/راهنما.md with the ready / missing count of each category.
# usage: python3 _work/highlights/sync.py
import json, os, shutil, subprocess

ROOT = '/Users/bmi/Desktop/100story'
src = open(f'{ROOT}/stories/data.js', encoding='utf-8').read()
DATA = json.loads(src[src.index('['):src.rindex(']') + 1])
LIST = json.load(open(f'{ROOT}/_work/highlights/list.json', encoding='utf-8'))
fa = lambda n: str(n).translate(str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹'))

guide = open(f'{ROOT}/highlights/راهنما.md', encoding='utf-8').read()
tail = guide[guide.index('## روش گذاشتن'):]
out = ['# هایلایت‌های اینستاگرام', '',
       'هر پوشه = یک هایلایت. `00-cover.jpg` کاور است؛ بقیه به همین ترتیب شماره، استوری‌ها هستند.', '']
for h in LIST:
    d = f'{ROOT}/highlights/{h["dir"]}'
    os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        if f.endswith('.mp4'): os.remove(f'{d}/{f}')
    items = [p for p in DATA if p['family'] in h['fams']]
    missing = []
    for i, p in enumerate(items, 1):
        name = f'{i:02d}-{p["slug"].split("-", 1)[1]}'
        v = f'{ROOT}/videos/{p["slug"]}.mp4'
        if os.path.exists(v):
            # APFS clone: an independent file that takes no extra disk space
            if subprocess.run(['cp', '-c', v, f'{d}/{name}.mp4']).returncode: shutil.copy2(v, f'{d}/{name}.mp4')
        else:
            missing.append(f'- {name} ({p["fa"]})')
    out += [f'## {h["dir"]} — {fa(len(items))} استوری', f'آماده: {fa(len(items) - len(missing))} · هنوز ویدیو ندارد: {fa(len(missing))}', '']
    if missing:
        out += ['<details><summary>ویدیوهای ساخته‌نشده</summary>', '', *missing, '', '</details>', '']
    print(h['dir'], len(items) - len(missing), '/', len(items))
open(f'{ROOT}/highlights/راهنما.md', 'w', encoding='utf-8').write('\n'.join(out) + '\n' + tail)
