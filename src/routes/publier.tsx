import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Upload, Check, Video } from 'lucide-react';
import { ClipShell, AccountUnavailable } from '@/shared/components/clip-shell';
import { useClipSession } from '@/shared/components/clip-session';
import { Button } from '@/components/ui/button';
import { finalizeVideo } from '@/videos/lib/clip.functions';
import { supabase } from '@/integrations/supabase/client';
import { setUpload, uploadWithProgress, useUpload } from '@/videos/lib/upload-store';
import { CameraRecorder } from '@/videos/components/clip-recorder';
export const Route = createFileRoute('/publier')({ head: () => ({ meta: [{ title: 'VINASOUND — Publier une vidéo' }, { name: 'description', content: 'Partage une création vidéo sur VINASOUND.' }, { property: 'og:title', content: 'VINASOUND — Publier une vidéo' }, { property: 'og:description', content: 'Partage une création vidéo sur VINASOUND.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }), component: Page });
function Page() {
  const { user, ready } = useClipSession(); const finalize = useServerFn(finalizeVideo); const qc = useQueryClient(); const navigate = useNavigate(); const upload = useUpload();
  const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState(''); const [caption, setCaption] = useState(''); const [visibility, setVisibility] = useState('public'); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [done, setDone] = useState(false); const [camera, setCamera] = useState(false);
  useEffect(() => { if (!file) { setPreview(''); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  return <ClipShell title="Publier une vidéo">{!ready ? <p>Chargement…</p> : !user ? <AccountUnavailable/> : done ? <div className="flex min-h-80 flex-col items-center justify-center gap-5"><Check className="size-12 text-secondary" /><h2 className="text-xl">Vidéo publiée</h2><Button asChild><Link to="/profil">Voir mes vidéos</Link></Button><Button variant="ghost" onClick={() => { setDone(false); setFile(null); setCaption(''); }}>Publier une autre vidéo</Button></div> : <form className="space-y-5" onSubmit={async e => {
    e.preventDefault(); if (busy || !file || upload.status === 'uploading' || upload.status === 'finishing') return;
    const f = file, cap = caption, vis: 'public' | 'private' = visibility === 'private' ? 'private' : 'public';
    const { data: s } = await supabase.auth.getSession(); const token = s.session?.access_token;
    if (!token) { setError('Session indisponible, recharge la page.'); return; }
    const ext = f.type === 'video/webm' ? 'webm' : 'mp4'; const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    setUpload({ status: 'uploading', progress: 0 }); navigate({ to: '/' });
    (async () => {
      try {
        await uploadWithProgress(path, f, token, p => setUpload({ status: 'uploading', progress: p }));
        setUpload({ status: 'finishing', progress: 100 });
        await finalize({ data: { path, caption: cap, visibility: vis } });
        qc.invalidateQueries({ queryKey: ['feed'] }); qc.invalidateQueries({ queryKey: ['own-videos'] });
        setUpload({ status: 'done', progress: 100 });
      } catch (err) { setUpload({ status: 'error', progress: 0, message: err instanceof Error ? err.message : 'La publication a échoué.' }); }
    })();
  }}>
    <p className="text-sm text-muted-foreground">Disponible 24 heures, puis supprimée définitivement, fichier compris.</p>
    <div className="grid grid-cols-2 gap-3">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border bg-card p-4 text-center transition-colors hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
        <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><Upload className="size-7" /></span>
        <span className="text-sm font-semibold">Téléverser</span>
        <span className="text-[11px] leading-tight text-muted-foreground">MP4 ou WebM · 50 Mo</span>
        <input type="file" accept="video/mp4,video/webm" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f && f.size > 50 * 1024 * 1024) { setError('La vidéo dépasse 50 Mo.'); return; } setFile(f ?? null); setError(''); }} />
      </label>
      <button type="button" onClick={() => setCamera(true)} className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-4 text-center transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="relative flex size-14 items-center justify-center rounded-full border-4 border-destructive/40 bg-background">
          <Video className="size-7 text-foreground" />
          <span className="absolute -right-0.5 -top-0.5 size-4 animate-pulse rounded-full border-2 border-card bg-destructive" />
        </span>
        <span className="text-sm font-semibold">Enregistrer</span>
        <span className="text-[11px] leading-tight text-muted-foreground">Avec la caméra</span>
      </button>
    </div>
    {camera && <CameraRecorder onDone={f => { setFile(f); setError(''); setCamera(false); }} onCancel={() => setCamera(false)} />}
    {preview && <video src={preview} controls playsInline className="mx-auto max-h-72 w-full rounded-md bg-muted object-contain" />}
    <label className="block text-sm">Légende<textarea value={caption} maxLength={500} onChange={e => setCaption(e.target.value)} placeholder="Une légende, des #hashtags…" className="mt-2 min-h-24 w-full rounded-md border bg-muted p-3" /></label><label className="block text-sm">Visibilité<select value={visibility} onChange={e => setVisibility(e.target.value)} className="mt-2 w-full rounded-md border bg-muted p-3"><option value="public">Tout le monde</option><option value="private">Moi uniquement</option></select></label>{error && <p role="alert" className="text-sm text-primary">{error}</p>}<Button type="submit" className="w-full" disabled={busy || !file}>{busy ? 'Publication en cours…' : 'Publier la vidéo'}</Button></form>}</ClipShell>;
}