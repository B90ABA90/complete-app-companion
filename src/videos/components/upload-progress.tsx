import { X, AlertCircle } from 'lucide-react';
import { setUpload, useUpload } from '@/videos/lib/upload-store';

export function UploadProgress() {
  const u = useUpload();
  if (u.status === 'idle' || u.status === 'done') return null;
  const pct = u.progress;
  const r = 20, c = 2 * Math.PI * r;
  const label = u.status === 'uploading' ? 'Envoi de ta vidéo…' : u.status === 'finishing' ? 'Publication en cours…' : 'Échec de l’envoi';
  return <div role="status" aria-live="polite" className="fixed bottom-20 left-1/2 z-50 flex w-[min(92vw,360px)] -translate-x-1/2 items-center gap-3 rounded-2xl border bg-card p-3 text-card-foreground shadow-2xl md:bottom-6">
    <div className="relative grid size-12 shrink-0 place-items-center">
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90"><circle cx="24" cy="24" r={r} fill="none" strokeWidth="4" className="stroke-muted" /><circle cx="24" cy="24" r={r} fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} className={`transition-[stroke-dashoffset] duration-300 ${u.status === 'error' ? 'stroke-destructive' : 'stroke-primary'}`} /></svg>
      {u.status === 'error' ? <AlertCircle className="size-5 text-destructive" /> : <span className="text-xs font-bold tabular-nums">{pct}%</span>}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold">{label}</p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-[width] duration-300 ${u.status === 'error' ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${pct}%` }} /></div>
      <p className="mt-1 truncate text-xs text-muted-foreground">{u.status === 'error' ? u.message : u.status === 'finishing' ? '100 % envoyé, on finalise' : 'Ne ferme pas la page'}</p>
    </div>
    {u.status === 'error' && <button type="button" aria-label="Fermer" onClick={() => setUpload({ status: 'idle', progress: 0 })} className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-muted"><X className="size-4" /></button>}
  </div>;
}
