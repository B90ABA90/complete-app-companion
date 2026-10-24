import { useEffect, useRef, useState } from 'react';
import { Camera, Square, Circle, SwitchCamera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MAX_VIDEO_BYTES } from '@/videos/lib/clip-upload';

const MAX_SECONDS = 180;

function pickMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const m of ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return '';
}

export function CameraRecorder({ onDone, onCancel }: { onDone: (file: File) => void; onCancel: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');

  const stopTracks = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; };

  const openCamera = async (mode: 'user' | 'environment') => {
    setError('');
    stopTracks();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
    } catch {
      setError('Autorise l’accès à la caméra et au micro dans ton navigateur, puis réessaie.');
    }
  };

  useEffect(() => {
    void openCamera(facing);
    return () => { stopTracks(); if (timerRef.current) clearInterval(timerRef.current); recorderRef.current?.state === 'recording' && recorderRef.current.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  const finish = () => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== 'recording') return;
    rec.stop();
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) { setError('La caméra n’est pas encore prête.'); return; }
    const mime = pickMime();
    if (!mime) { setError('Ton navigateur ne sait pas enregistrer de vidéo.'); return; }
    chunksRef.current = [];
    const rec = new MediaRecorder(stream, { mimeType: mime });
    recorderRef.current = rec;
    rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setRecording(false);
      const type = mime.split(';')[0] ?? 'video/webm';
      const blob = new Blob(chunksRef.current, { type });
      if (blob.size === 0) { setError('L’enregistrement est vide. Réessaie.'); return; }
      if (blob.size > MAX_VIDEO_BYTES) { setError('La vidéo enregistrée dépasse 50 Mo. Enregistre plus court.'); return; }
      const ext = type === 'video/mp4' ? 'mp4' : 'webm';
      onDone(new File([blob], `camera-${Date.now()}.${ext}`, { type }));
    };
    rec.start(1000);
    setSeconds(0);
    setRecording(true);
    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s + 1 >= MAX_SECONDS) { finish(); return MAX_SECONDS; }
        return s + 1;
      });
    }, 1000);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return <div className="space-y-3 rounded-md border bg-card p-4">
    <div className="flex items-center justify-between">
      <p className="flex items-center gap-2 text-sm font-semibold"><Camera className="size-4 text-secondary" />Enregistrer avec la caméra</p>
      <Button type="button" variant="ghost" size="icon" aria-label="Fermer la caméra" onClick={() => { stopTracks(); onCancel(); }}><X /></Button>
    </div>
    <div className="relative overflow-hidden rounded-md bg-muted">
      <video ref={videoRef} muted playsInline className="max-h-72 w-full object-contain" aria-label="Aperçu de la caméra" />
      {recording && <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-bold text-primary"><span className="size-2 animate-pulse rounded-full bg-primary" />{mm}:{ss}</span>}
    </div>
    {error ? <p role="alert" className="text-sm text-primary">{error}</p> : null}
    <div className="flex items-center justify-center gap-3">
      {!recording ? <Button type="button" onClick={startRecording} disabled={!!error}><Circle className="fill-current" />Démarrer</Button>
        : <Button type="button" variant="destructive" onClick={finish}><Square className="fill-current" />Arrêter</Button>}
      <Button type="button" variant="outline" size="icon" aria-label="Changer de caméra" disabled={recording} onClick={() => setFacing(f => (f === 'user' ? 'environment' : 'user'))}><SwitchCamera /></Button>
    </div>
    <p className="text-center text-xs text-muted-foreground">3 minutes maximum · la vidéo reste disponible 24 heures</p>
  </div>;
}
