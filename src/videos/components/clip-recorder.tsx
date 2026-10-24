import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Music, X, SwitchCamera, Mic, MicOff, Sparkles, FlipHorizontal2, RotateCcw, Check, Upload } from 'lucide-react';
import { MAX_VIDEO_BYTES } from '@/videos/lib/clip-upload';
import { DURATIONS, FILTERS, MAX_AUDIO_BYTES, MIN_TAKE_MS, ZOOMS, recordLimitSeconds, ringOffset } from '@/videos/lib/recorder-rules';

const W = 720, H = 1280, R = 44, CIRC = 2 * Math.PI * R;

function pickMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const m of ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return '';
}

type Sound = { name: string; url: string; duration: number | null };

export function CameraRecorder({ onDone, onCancel }: { onDone: (file: File) => void; onCancel: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(0);
  const holdingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioNodeRef = useRef<{ el: HTMLAudioElement; node: MediaElementAudioSourceNode } | null>(null);
  const cleanupMixRef = useRef<() => void>(() => {});

  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [zoom, setZoom] = useState<number>(1);
  const [filterIdx, setFilterIdx] = useState(0);
  const [mirror, setMirror] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [durationIdx, setDurationIdx] = useState(1);
  const [sound, setSound] = useState<Sound | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [review, setReview] = useState<{ file: File; url: string } | null>(null);

  const settingsRef = useRef({ zoom, filter: 'none' as string, mirror });
  settingsRef.current = { zoom, filter: FILTERS[filterIdx]?.css ?? 'none', mirror };
  const limit = recordLimitSeconds(DURATIONS[durationIdx]?.seconds ?? 60, sound?.duration);
  const limitRef = useRef(limit); limitRef.current = limit;
  const micRef = useRef(micOn); micRef.current = micOn;

  const stopTracks = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; };

  // Lock page scroll while the full-screen recorder is open.
  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !holdingRef.current) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onCancel]);

  // Camera + drawing loop: the canvas is both the preview and what gets recorded (zoom, filter, mirror included).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(''); stopTracks();
      const video = { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } };
      let stream: MediaStream | null = null;
      try { stream = await navigator.mediaDevices.getUserMedia({ video, audio: true }); }
      catch { try { stream = await navigator.mediaDevices.getUserMedia({ video }); } catch { stream = null; } }
      if (cancelled) { stream?.getTracks().forEach(t => t.stop()); return; }
      if (!stream) { setError('Autorise l’accès à la caméra et au micro dans ton navigateur, puis réessaie.'); return; }
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
    })();
    return () => { cancelled = true; };
  }, [facing]);

  useEffect(() => {
    setMirror(facing === 'user');
  }, [facing]);

  useEffect(() => {
    const draw = () => {
      const v = videoRef.current, c = canvasRef.current;
      if (v && c && v.readyState >= 2 && v.videoWidth) {
        const ctx = c.getContext('2d');
        if (ctx) {
          const { zoom: z, filter, mirror: m } = settingsRef.current;
          const scale = Math.max(W / v.videoWidth, H / v.videoHeight) * z;
          const dw = v.videoWidth * scale, dh = v.videoHeight * scale;
          ctx.save(); ctx.filter = filter;
          if (m) { ctx.translate(W, 0); ctx.scale(-1, 1); }
          ctx.drawImage(v, (W - dw) / 2, (H - dh) / 2, dw, dh);
          ctx.restore();
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (recorderRef.current?.state === 'recording') { recorderRef.current.onstop = null; recorderRef.current.stop(); }
    cleanupMixRef.current();
    audioRef.current?.pause();
    void audioCtxRef.current?.close().catch(() => {});
    stopTracks();
  }, []);

  useEffect(() => () => { if (sound) URL.revokeObjectURL(sound.url); }, [sound]);
  useEffect(() => () => { if (review) URL.revokeObjectURL(review.url); }, [review]);

  const chooseSound = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('audio/')) { setHint('Choisis un fichier audio (MP3, M4A, WAV…).'); return; }
    if (f.size > MAX_AUDIO_BYTES) { setHint('Le son dépasse 20 Mo.'); return; }
    const url = URL.createObjectURL(f);
    const el = new Audio(url); el.preload = 'auto';
    el.onloadedmetadata = () => setSound(s => (s && s.url === url ? { ...s, duration: el.duration } : s));
    audioRef.current?.pause();
    audioRef.current = el; audioNodeRef.current = null;
    setSound({ name: f.name.replace(/\.[^.]+$/, ''), url, duration: null });
    setMicOn(false); setHint('');
  };

  const removeSound = () => { audioRef.current?.pause(); audioRef.current = null; audioNodeRef.current = null; setSound(null); setMicOn(true); };

  const stop = () => {
    holdingRef.current = false;
    const rec = recorderRef.current;
    if (rec && rec.state === 'recording') rec.stop();
  };

  const start = async () => {
    if (recorderRef.current?.state === 'recording') return;
    const stream = streamRef.current, canvas = canvasRef.current;
    if (!stream || !canvas) { setHint('La caméra n’est pas encore prête.'); return; }
    const mime = pickMime();
    if (!mime) { setHint('Ton navigateur ne sait pas enregistrer de vidéo.'); return; }
    setHint('');

    const ctx = audioCtxRef.current ?? new AudioContext();
    audioCtxRef.current = ctx;
    await ctx.resume().catch(() => {});
    if (!holdingRef.current) return; // released before we were ready

    const dest = ctx.createMediaStreamDestination();
    const cleanups: Array<() => void> = [];
    const micTracks = stream.getAudioTracks();
    if (micRef.current && micTracks.length) {
      const mic = ctx.createMediaStreamSource(new MediaStream(micTracks));
      mic.connect(dest); cleanups.push(() => mic.disconnect());
    }
    const el = audioRef.current;
    if (el) {
      if (!audioNodeRef.current || audioNodeRef.current.el !== el) {
        const node = ctx.createMediaElementSource(el);
        node.connect(ctx.destination);
        audioNodeRef.current = { el, node };
      }
      const node = audioNodeRef.current.node;
      node.connect(dest);
      cleanups.push(() => { try { node.disconnect(dest); } catch { /* already disconnected */ } el.pause(); });
      el.currentTime = 0;
      el.onended = () => stop();
      void el.play().catch(() => {});
    }
    cleanupMixRef.current = () => { cleanups.forEach(fn => fn()); cleanupMixRef.current = () => {}; };

    const tracks = [...canvas.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()];
    chunksRef.current = [];
    const rec = new MediaRecorder(new MediaStream(tracks), { mimeType: mime });
    recorderRef.current = rec;
    rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      cleanupMixRef.current();
      tracks[0]?.stop();
      setRecording(false);
      const took = performance.now() - startedRef.current;
      setElapsed(0);
      if (took < MIN_TAKE_MS) { setHint('Maintiens le bouton rouge appuyé pour enregistrer.'); return; }
      const type = mime.split(';')[0] ?? 'video/webm';
      const blob = new Blob(chunksRef.current, { type });
      if (blob.size === 0) { setHint('L’enregistrement est vide. Réessaie.'); return; }
      if (blob.size > MAX_VIDEO_BYTES) { setHint('La vidéo dépasse 50 Mo. Enregistre plus court.'); return; }
      const ext = type === 'video/mp4' ? 'mp4' : 'webm';
      const file = new File([blob], `camera-${Date.now()}.${ext}`, { type });
      setReview({ file, url: URL.createObjectURL(file) });
    };
    rec.start(500);
    startedRef.current = performance.now();
    setElapsed(0); setRecording(true);
    tickRef.current = setInterval(() => {
      const ms = performance.now() - startedRef.current;
      setElapsed(ms);
      if (ms >= limitRef.current * 1000) stop();
    }, 100);
  };

  const pickGallery = (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_VIDEO_BYTES) { setHint('La vidéo dépasse 50 Mo.'); return; }
    onDone(f);
  };

  const secs = Math.floor(elapsed / 1000);
  const clock = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  const tool = 'flex flex-col items-center gap-1 text-[10px] font-medium text-foreground drop-shadow disabled:opacity-40';
  const toolIcon = 'grid size-10 place-items-center rounded-full bg-background/40 backdrop-blur';

  return createPortal(<div role="dialog" aria-modal="true" aria-label="Enregistrer une vidéo" className="recorder-theme fixed inset-0 z-[100] flex select-none flex-col bg-background text-foreground">
    <div className="relative mx-auto h-full w-full max-w-md overflow-hidden">
      <video ref={videoRef} muted playsInline className="hidden" />
      <canvas ref={canvasRef} width={W} height={H} aria-label="Aperçu de la caméra" className={`absolute inset-0 h-full w-full object-cover ${review ? 'invisible' : ''}`} />

      {review ? <>
        <video src={review.url} autoPlay loop playsInline controls={false} className="absolute inset-0 h-full w-full object-cover" aria-label="Revoir la vidéo enregistrée" onClick={e => { const v = e.currentTarget; if (v.paused) void v.play(); else v.pause(); }} />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 bg-gradient-to-t from-background/90 to-transparent px-5 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-16">
          <button type="button" onClick={() => setReview(null)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-secondary font-semibold"><RotateCcw className="size-5" />Recommencer</button>
          <button type="button" onClick={() => onDone(review.file)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-destructive font-semibold text-destructive-foreground"><Check className="size-5" />Publier</button>
        </div>
      </> : <>
        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-background/70 to-transparent px-4 pb-8 pt-[calc(env(safe-area-inset-top)+1rem)]">
          <button type="button" aria-label="Fermer" disabled={recording} onClick={onCancel} className="grid size-10 place-items-center disabled:opacity-40"><X className="size-7" /></button>
          {sound ? <div className="flex min-w-0 items-center gap-2 rounded-full bg-background/50 py-2 pl-4 pr-2 text-sm font-semibold backdrop-blur">
            <Music className="size-4 shrink-0" /><span className="max-w-40 truncate">{sound.name}</span>
            {!recording && <button type="button" aria-label="Retirer le son" onClick={removeSound} className="grid size-6 place-items-center rounded-full bg-background/60"><X className="size-3.5" /></button>}
          </div> : <label className="flex cursor-pointer items-center gap-2 rounded-full bg-background/50 px-4 py-2 text-sm font-semibold backdrop-blur">
            <Music className="size-4" />Ajouter un son
            <input type="file" accept="audio/*" className="sr-only" onChange={e => { chooseSound(e.target.files?.[0]); e.target.value = ''; }} />
          </label>}
          <span className="size-10" />
        </div>

        {/* Small settings */}
        <div className={`absolute right-3 top-[calc(env(safe-area-inset-top)+5rem)] flex flex-col gap-4 transition-opacity ${recording ? 'pointer-events-none opacity-0' : ''}`}>
          <button type="button" className={tool} onClick={() => setFacing(f => (f === 'user' ? 'environment' : 'user'))}><span className={toolIcon}><SwitchCamera className="size-5" /></span>Retourner</button>
          <button type="button" className={tool} onClick={() => setFilterIdx(i => (i + 1) % FILTERS.length)}><span className={toolIcon}><Sparkles className="size-5" /></span>{FILTERS[filterIdx]?.label}</button>
          <button type="button" className={tool} aria-pressed={micOn} onClick={() => setMicOn(m => !m)}><span className={toolIcon}>{micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}</span>{micOn ? 'Micro' : 'Micro coupé'}</button>
          <button type="button" className={tool} aria-pressed={mirror} onClick={() => setMirror(m => !m)}><span className={toolIcon}><FlipHorizontal2 className="size-5" /></span>Miroir</button>
        </div>

        {recording && <span className="absolute left-1/2 top-[calc(env(safe-area-inset-top)+4.5rem)] flex -translate-x-1/2 items-center gap-2 rounded-full bg-background/60 px-3 py-1 text-xs font-bold backdrop-blur"><span className="size-2 animate-pulse rounded-full bg-destructive" />{clock}</span>}
        {error && <p role="alert" className="absolute inset-x-6 top-1/3 rounded-xl bg-background/80 p-4 text-center text-sm">{error}</p>}

        {/* Bottom controls */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-background/80 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-10">
          {hint && <p role="status" className="rounded-full bg-background/70 px-3 py-1 text-xs">{hint}</p>}
          <div className={`flex flex-col items-center gap-2 transition-opacity ${recording ? 'pointer-events-none opacity-0' : ''}`}>
            <div className="flex gap-1 rounded-full bg-background/40 p-1 text-xs font-semibold backdrop-blur">
              {ZOOMS.map(z => <button key={z} type="button" aria-pressed={zoom === z} onClick={() => setZoom(z)} className={`rounded-full px-3 py-1 ${zoom === z ? 'bg-foreground text-background' : ''}`}>{z}x</button>)}
            </div>
            <div className="flex gap-1 text-xs font-semibold">
              {DURATIONS.map((d, i) => <button key={d.label} type="button" aria-pressed={durationIdx === i} onClick={() => setDurationIdx(i)} className={`rounded-full px-3 py-1 ${durationIdx === i ? 'bg-foreground text-background' : 'text-foreground/80'}`}>{d.label}</button>)}
            </div>
          </div>

          <div className="grid w-full grid-cols-3 items-center">
            <span />
            <button type="button" aria-label={recording ? 'Relâche pour arrêter' : 'Maintiens pour enregistrer'} disabled={!!error}
              className="relative mx-auto grid size-24 touch-none place-items-center disabled:opacity-40"
              onContextMenu={e => e.preventDefault()}
              onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); holdingRef.current = true; void start(); }}
              onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
              onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); holdingRef.current = true; void start(); } }}
              onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') stop(); }}>
              <svg viewBox="0 0 96 96" className="absolute inset-0 -rotate-90" aria-hidden>
                <circle cx="48" cy="48" r={R} fill="none" strokeWidth="5" className="stroke-foreground/80" />
                <circle cx="48" cy="48" r={R} fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-destructive" strokeDasharray={CIRC} strokeDashoffset={recording ? ringOffset(elapsed, limit, CIRC) : CIRC} />
              </svg>
              <span className={`rounded-full bg-destructive transition-all duration-200 ${recording ? 'size-12 rounded-xl' : 'size-[4.5rem]'}`} />
            </button>
            <label className={`mx-auto flex cursor-pointer flex-col items-center gap-1 text-[10px] font-medium ${recording ? 'pointer-events-none opacity-0' : ''}`}>
              <span className="grid size-11 place-items-center rounded-lg border-2 border-foreground/80 bg-background/40"><Upload className="size-5" /></span>Téléverser
              <input type="file" accept="video/mp4,video/webm" className="sr-only" onChange={e => pickGallery(e.target.files?.[0])} />
            </label>
          </div>
          <p className="text-[11px] text-foreground/70">{recording ? 'Relâche pour arrêter' : `Maintiens le bouton rouge · ${limit < 60 ? `${Math.round(limit)} s` : `${Math.floor(limit / 60)} min${limit % 60 ? ` ${Math.round(limit % 60)} s` : ''}`} max`}</p>
        </div>
      </>}
    </div>
  </div>, document.body);
}
