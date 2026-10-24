// Builds a downloadable copy of a video with the VINASOUND signature burned in:
// a small watermark during playback, then the VINASOUND end card + signature sound.
import { playEndSignature } from '@/videos/lib/feed-sound';

export const OUTRO_SECONDS = 2.3;
const MIMES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1,mp4a',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

/** MP4 is always preferred; WebM only when the browser cannot record MP4. */
export function pickExportMime(supported: (mime: string) => boolean): string {
  return MIMES.find(m => supported(m)) ?? '';
}

export function exportFileName(id: string, mime: string): string {
  return `vinasound-${id.slice(0, 8)}.${mime.startsWith('video/mp4') ? 'mp4' : 'webm'}`;
}

/** Recordings that are not already MP4 are converted in the browser before saving. */
export function needsMp4Conversion(mime: string): boolean {
  return !mime.startsWith('video/mp4');
}

/** Converts a recorded file (e.g. WebM) to an H.264 MP4 entirely in the browser. */
export async function convertToMp4(input: Blob, onProgress: (ratio: number) => void): Promise<Blob> {
  const mb = await import('mediabunny');
  // H.264 plays everywhere (iPhone, WhatsApp, galleries); VP9-in-MP4 is the last resort.
  const videoCodec = (await mb.canEncodeVideo('avc')) ? 'avc' : (await mb.canEncodeVideo('vp9')) ? 'vp9' : null;
  if (!videoCodec) throw new Error('Ce navigateur ne sait pas créer de MP4. Essaie avec Chrome, Edge ou Safari à jour.');
  const audioCodec = (await mb.canEncodeAudio('aac')) ? 'aac' : 'opus';
  const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }), target: new mb.BufferTarget() });
  const conversion = await mb.Conversion.init({
    input: new mb.Input({ source: new mb.BlobSource(input), formats: mb.ALL_FORMATS }),
    output,
    video: { codec: videoCodec, forceTranscode: true },
    audio: { codec: audioCodec },
    showWarnings: false,
  });
  if (!conversion.isValid) throw new Error('Conversion en MP4 impossible sur ce navigateur.');
  conversion.onProgress = p => onProgress(p);
  await conversion.execute();
  const buf = output.target.buffer;
  if (!buf || buf.byteLength === 0) throw new Error('Conversion en MP4 impossible.');
  return new Blob([buf], { type: 'video/mp4' });
}

function colors() {
  const s = getComputedStyle(document.documentElement);
  const g = (n: string, f: string) => s.getPropertyValue(n).trim() || f;
  return { ink: g('--brand-ink', 'rgb(20,15,12)'), primary: g('--primary', 'rgb(243,154,43)'), onPrimary: g('--primary-foreground', 'rgb(40,25,10)'), text: g('--video-action-foreground', 'rgb(237,237,237)') };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function drawLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, c: ReturnType<typeof colors>) {
  ctx.fillStyle = c.primary; roundRect(ctx, cx - size / 2, cy - size / 2, size, size, size * 0.24); ctx.fill();
  const bars = [0.3, 0.6, 1, 0.6, 0.85, 0.4]; const bw = size * 0.07, gap = size * 0.06;
  const total = bars.length * bw + (bars.length - 1) * gap; let x = cx - total / 2;
  ctx.fillStyle = c.onPrimary;
  for (const h of bars) { const bh = size * 0.55 * h; roundRect(ctx, x, cy - bh / 2, bw, bh, bw / 2); ctx.fill(); x += bw + gap; }
}

function drawWordmark(ctx: CanvasRenderingContext2D, cx: number, y: number, px: number, c: ReturnType<typeof colors>) {
  ctx.font = `800 ${px}px system-ui, sans-serif`; ctx.textBaseline = 'middle';
  const a = ctx.measureText('VINA').width, b = ctx.measureText('SOUND').width; const x = cx - (a + b) / 2;
  ctx.textAlign = 'left'; ctx.fillStyle = c.text; ctx.fillText('VINA', x, y); ctx.fillStyle = c.primary; ctx.fillText('SOUND', x + a, y);
}

function drawWatermark(ctx: CanvasRenderingContext2D, W: number, H: number, c: ReturnType<typeof colors>) {
  const u = Math.min(W, H) / 20;
  ctx.save(); ctx.globalAlpha = 0.85; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = u / 2;
  drawLogo(ctx, u * 1.6, u * 1.6, u * 1.6, c);
  ctx.font = `800 ${u * 0.8}px system-ui, sans-serif`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillStyle = c.text; ctx.fillText('VINA', u * 2.7, u * 1.6); ctx.fillStyle = c.primary; ctx.fillText('SOUND', u * 2.7 + ctx.measureText('VINA').width, u * 1.6);
  ctx.restore();
}

function drawOutro(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, artist: string, c: ReturnType<typeof colors>) {
  const u = Math.min(W, H);
  ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = c.ink; ctx.fillRect(0, 0, W, H);
  const pop = Math.min(1, t / 0.5); const ease = 1 - Math.pow(1 - pop, 3) * Math.cos(pop * Math.PI * 1.5);
  const pulse = t > 0.6 ? 1 + 0.06 * Math.sin((t - 0.6) * 7) : 1;
  const size = u * 0.24 * Math.max(0.2, ease) * pulse;
  drawLogo(ctx, W / 2, H / 2 - u * 0.12, size, c);
  const rise = Math.min(1, Math.max(0, (t - 0.25) / 0.45));
  ctx.globalAlpha = rise;
  drawWordmark(ctx, W / 2, H / 2 + u * 0.1 + (1 - rise) * u * 0.04, u * 0.11, c);
  ctx.font = `600 ${u * 0.045}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = c.text;
  ctx.fillText(`@${artist}`, W / 2, H / 2 + u * 0.2);
  ctx.restore();
}

/** Call synchronously inside the click so the browser lets the copy play with sound. */
export function prepareExport() {
  const video = document.createElement('video');
  video.playsInline = true; video.preload = 'auto';
  const ac = new AudioContext(); void ac.resume();
  return { video, ac };
}

export async function exportWithSignature(
  prep: ReturnType<typeof prepareExport>,
  src: string,
  artist: string,
  onProgress: (ratio: number) => void,
): Promise<{ blob: Blob; mime: string }> {
  const { video: v, ac } = prep;
  const mime = pickExportMime(m => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m));
  if (!mime) throw new Error('Ton navigateur ne peut pas préparer le téléchargement.');
  const convert = needsMp4Conversion(mime);
  const share = convert ? 0.7 : 1;
  const report = (r: number) => onProgress(r * share);
  const res = await fetch(src);
  if (!res.ok) throw new Error('La vidéo n’est plus disponible.');
  const objectUrl = URL.createObjectURL(await res.blob());
  let timer: ReturnType<typeof setInterval> | null = null;
  try {
    v.src = objectUrl;
    await new Promise<void>((ok, ko) => { v.onloadedmetadata = () => ok(); v.onerror = () => ko(new Error('Cette vidéo ne peut pas être lue ici.')); });
    // Browser-recorded WebM files often report no duration; seek to the end once to learn it.
    if (!Number.isFinite(v.duration)) {
      await new Promise<void>(ok => { const t = setTimeout(ok, 3000); v.ondurationchange = () => { if (Number.isFinite(v.duration)) { clearTimeout(t); ok(); } }; v.currentTime = 1e9; });
      v.ondurationchange = null;
      await new Promise<void>(ok => { const t = setTimeout(ok, 2000); v.onseeked = () => { clearTimeout(t); ok(); }; v.currentTime = 0; });
      v.onseeked = null;
    }
    const scale = Math.min(1, 1280 / Math.max(v.videoWidth || 720, v.videoHeight || 1280));
    const W = Math.round((v.videoWidth || 720) * scale / 2) * 2, H = Math.round((v.videoHeight || 1280) * scale / 2) * 2;
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Préparation impossible.');
    const c = colors();
    await ac.resume();
    const dest = ac.createMediaStreamDestination();
    ac.createMediaElementSource(v).connect(dest);
    const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    const stopped = new Promise<void>(r => { rec.onstop = () => r(); });
    const duration = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 0;
    let outroAt = 0;
    v.onended = () => { if (outroAt) return; outroAt = performance.now(); playEndSignature({ ctx: ac, out: dest }); };
    const frame = () => {
      if (!outroAt) {
        ctx.drawImage(v, 0, 0, W, H); drawWatermark(ctx, W, H, c);
        if (duration) report(Math.min(0.99, v.currentTime / (duration + OUTRO_SECONDS)));
      } else {
        const t = (performance.now() - outroAt) / 1000;
        drawOutro(ctx, W, H, t, artist, c);
        if (duration) report(Math.min(0.99, (duration + t) / (duration + OUTRO_SECONDS)));
        if (t >= OUTRO_SECONDS && rec.state === 'recording') rec.stop();
      }
    };
    frame();
    rec.start(500);
    timer = setInterval(frame, 1000 / 30);
    await v.play().catch(() => { throw new Error('Touche encore « Télécharger » pour lancer la préparation.'); });
    await stopped;
    stream.getTracks().forEach(t => t.stop());
    const recorded = new Blob(chunks, { type: mime.split(';')[0] ?? 'video/mp4' });
    if (!convert) { onProgress(1); return { blob: recorded, mime }; }
    const mp4 = await convertToMp4(recorded, p => onProgress(share + p * (1 - share)));
    onProgress(1);
    return { blob: mp4, mime: 'video/mp4' };
  } finally {
    if (timer) clearInterval(timer);
    v.pause(); URL.revokeObjectURL(objectUrl); void ac.close().catch(() => {});
  }
}

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
