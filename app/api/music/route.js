// GET -> list of songs in music/      POST (multipart, field "file") -> adds a song to music/
import fs from 'node:fs';
import path from 'node:path';
import { MUSIC_DIR, AUDIO_EXT, listMusic } from '../../../lib/store.js';

export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ music: listMusic() });
}

export async function POST(req) {
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') return Response.json({ error: 'فایلی انتخاب نشده' }, { status: 400 });
  let name = path.basename(String(file.name || 'song.mp3')).replace(/[\\/:*?"<>|\x00-\x1f]/g, '').replace(/^\.+/, '').trim();
  if (!AUDIO_EXT.test(name)) return Response.json({ error: 'فقط فایل صوتی (mp3، m4a، wav، aac، ogg، flac)' }, { status: 400 });
  fs.mkdirSync(MUSIC_DIR, { recursive: true });
  // never overwrite an existing song: "name (2).mp3"
  const ext = path.extname(name), stem = name.slice(0, -ext.length);
  for (let i = 2; fs.existsSync(path.join(MUSIC_DIR, name)); i++) name = `${stem} (${i})${ext}`;
  fs.writeFileSync(path.join(MUSIC_DIR, name), Buffer.from(await file.arrayBuffer()));
  return Response.json({ ok: true, name, music: listMusic() });
}
