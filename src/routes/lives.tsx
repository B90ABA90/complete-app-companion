import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Radio, Mic, Video, Heart, Play, Check, X, Wifi, ArrowRight, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ClipShell } from '@/shared/components/clip-shell';
import { useClipSession } from '@/shared/components/clip-session';
import { Button } from '@/components/ui/button';
import { useServerFn } from '@tanstack/react-start';
import { startStreamLive } from '@/lives/lib/live.functions';
import { ClientOnly } from '@tanstack/react-router';
import { ViewerPlayer } from '@/lives/components/browser-live';
import { isStreamUrl } from '@/lives/lib/live';
import { DEFAULT_SETTINGS, GUEST_SLOTS, type LiveSettings } from '@/lives/lib/live';

export const Route = createFileRoute('/lives')({
  head: () => ({ meta: [{ title: 'VINASOUND — Lives' }, { name: 'description', content: 'Écoutez et regardez les artistes VINASOUND en direct, en audio ou en vidéo.' }, { property: 'og:title', content: 'VINASOUND — Lives' }, { property: 'og:description', content: 'Écoutez et regardez les artistes VINASOUND en direct, en audio ou en vidéo.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: Page,
});

type Kind = 'audio' | 'video';
const GENRES = ['Rap', 'Afro', 'R&B', 'Acoustique', 'DJ', 'Folk', 'Gospel'];

function Page() {
  const { user } = useClipSession();
  const [wizard, setWizard] = useState(false);
  const { data: lives = [] } = useQuery({ queryKey: ['lives'], queryFn: async () => { const r = await supabase.from('lives').select('*,profiles!lives_user_id_fkey(username)').eq('status', 'live').order('created_at', { ascending: false }).limit(30); if (r.error) throw r.error; return r.data; }, refetchInterval: 4000 });
  const shown = lives;
  const featured = shown[0];
  return <div className="live-theme live-discovery bg-background text-foreground"><ClipShell title="Lives" wide>
    <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:hidden"><h1 className="text-2xl font-black tracking-tight">VINASOUND <span className="live-title-accent">LIVE</span></h1><Button size="sm" className="live-cta rounded-full" disabled={!user} onClick={() => setWizard(true)}><Radio />Créer</Button></div>
    <div className="live-discovery-toolbar">
      <h2 className="flex shrink-0 items-center gap-2 text-base font-semibold"><Video className="size-4 text-primary" />Live vidéo</h2>
      <Button className="hidden shrink-0 md:inline-flex" disabled={!user} onClick={() => setWizard(true)}><Radio />Créer un live</Button>
    </div>
    {featured && <section className="live-feature mb-8"><div className="live-feature-media video-surface">{featured.kind === 'audio' ? <Mic className="absolute inset-0 m-auto size-20 text-primary" /> : featured.stream_url && isStreamUrl(featured.stream_url) ? <iframe title={featured.title} src={featured.stream_url} allow="autoplay" className="absolute inset-0 size-full border-0" /> : <ClientOnly><ViewerPlayer liveId={featured.id} audioOnly={false} preview /></ClientOnly>}</div><div className="live-feature-copy"><span className="flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-xs font-bold tracking-wider text-destructive-foreground"><span className="size-1.5 animate-pulse rounded-full bg-destructive-foreground" />EN DIRECT</span><h1 className="break-words text-3xl font-extrabold leading-tight">{featured.title}</h1><p className="text-sm text-muted-foreground">@{featured.profiles?.username} · {featured.max_viewers} spectateur(s)</p><Button size="lg" className="live-cta rounded-full" asChild><Link to="/live/$id" params={{ id: featured.id }}><Play />Regarder le LIVE<ArrowRight /></Link></Button></div></section>}
    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold"><span className="size-2 animate-pulse rounded-full bg-destructive" /> En direct maintenant</h3>
    {shown.length === 0
      ? <div className="flex flex-col items-center gap-3 border-y py-20 text-center"><Radio className="size-10 text-muted-foreground" /><p className="font-semibold">Aucun live en cours</p><p className="max-w-sm text-sm text-muted-foreground">Les artistes ne sont pas en direct pour le moment. Repasse un peu plus tard.</p>{user && <Button onClick={() => setWizard(true)}>Lancer mon live</Button>}</div>
      : <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
        {shown.map(l => { const name = l.profiles?.username ?? 'artiste'; const audioLive = l.kind === 'audio'; return <Link key={l.id} to="/live/$id" params={{ id: l.id }} className="video-surface group relative block aspect-[3/4] overflow-hidden rounded-lg bg-muted transition hover:ring-2 hover:ring-primary">
          <span className="absolute inset-0 grid place-items-center text-5xl font-bold text-primary-foreground/80">{audioLive ? <Mic className="size-12" /> : name[0]?.toUpperCase()}</span>
          {!audioLive && (l.stream_url && isStreamUrl(l.stream_url)
            ? <iframe src={`${l.stream_url}?muted=true&autoplay=true&controls=false`} title={l.title} allow="autoplay" className="pointer-events-none absolute inset-0 size-full border-0" />
            : <ClientOnly><ViewerPlayer liveId={l.id} audioOnly={false} preview /></ClientOnly>)}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/90 to-transparent" />
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-destructive px-1.5 py-0.5 text-[11px] font-bold text-destructive-foreground"><span className="size-1.5 animate-pulse rounded-full bg-destructive-foreground" />LIVE</span>
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-background/70 px-1.5 py-0.5 text-[11px] backdrop-blur">{audioLive ? <Mic className="size-3" /> : <Video className="size-3" />}{audioLive ? 'Audio' : 'Vidéo'}</span>
          <span className="absolute inset-x-0 bottom-0 space-y-0.5 p-2.5">
            <span className="block truncate text-sm font-semibold">{l.title}</span>
            <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span className="truncate">@{name}</span><span className="flex shrink-0 items-center gap-1"><Heart className="size-3" />{l.like_count}</span></span>
            {l.genre && <span className="inline-block rounded-full bg-primary/80 px-2 py-0.5 text-[10px] text-primary-foreground">{l.genre}</span>}
          </span>
        </Link>; })}
      </div>}
    {wizard && <CreateLive onClose={() => setWizard(false)} />}
  </ClipShell></div>;
}

function CreateLive({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate(); const start = useServerFn(startStreamLive);
  const [step, setStep] = useState(0); const [kind, setKind] = useState<Kind>('video'); const [title, setTitle] = useState(''); const [genre, setGenre] = useState('');
  const [checks, setChecks] = useState<{ mic?: boolean | undefined; cam?: boolean | undefined; net?: boolean | undefined }>({}); const [busy, setBusy] = useState(false); const [via, setVia] = useState<'browser' | 'cloudflare'>('browser'); const [cfg, setCfg] = useState<LiveSettings>(DEFAULT_SETTINGS);
  const videoRef = useRef<HTMLVideoElement>(null); const streamRef = useRef<MediaStream | null>(null);
  useEffect(() => () => streamRef.current?.getTracks().forEach(t => t.stop()), []);
  useEffect(() => {
    if (step !== 1) return;
    setChecks({ net: navigator.onLine });
    navigator.mediaDevices?.getUserMedia({ audio: true, video: kind === 'video' }).then(s => {
      streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s;
      setChecks({ net: navigator.onLine, mic: s.getAudioTracks().length > 0, cam: kind === 'video' ? s.getVideoTracks().length > 0 : undefined });
    }).catch(() => setChecks(c => ({ ...c, mic: false, cam: kind === 'video' ? false : undefined })));
  }, [step, kind]);
  const steps = ['Paramètres', 'Prévisualisation', 'Diffusion'];
  const Row = ({ ok, label }: { ok?: boolean | undefined; label: string }) => <li className="flex items-center justify-between gap-2 py-2.5 text-sm first:pt-0 last:pb-0"><span>{label}</span>{ok ? <span className="flex items-center gap-1 text-xs text-primary"><Check className="size-4" /> Prêt</span> : <span className="flex items-center gap-1 text-xs text-destructive"><X className="size-4" /> Indisponible</span>}</li>;
  const [camOn, setCamOn] = useState(true); const [micOn, setMicOn] = useState(true);
  const toggle = (type: 'audio' | 'video') => { const tracks = type === 'audio' ? streamRef.current?.getAudioTracks() : streamRef.current?.getVideoTracks(); const next = type === 'audio' ? !micOn : !camOn; tracks?.forEach(t => { t.enabled = next; }); type === 'audio' ? setMicOn(next) : setCamOn(next); };
  const card = 'rounded-2xl border bg-gradient-to-br from-muted/60 to-card p-4';
  return <div role="dialog" aria-modal="true" aria-label="Créer un live" className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-md sm:items-center sm:p-4">
    <div className="flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border bg-card shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl">
      <div className="sticky top-0 z-10 space-y-3 border-b bg-card/95 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto h-1 w-10 rounded-full bg-muted sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary">Studio live · {step + 1} / 3</p><h2 className="text-xl font-bold leading-tight">Démarrer un LIVE</h2></div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose} aria-label="Fermer"><X /></Button>
        </div>
        <ol className="grid grid-cols-3 gap-1.5">{steps.map((s, i) => <li key={s} className="space-y-1"><span className={`block h-1.5 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} /><span className={`block truncate text-[11px] ${i === step ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{s}</span></li>)}</ol>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {step === 0 && <>
        <section className={card}><h3 className="mb-3 font-semibold">Type de diffusion</h3>
          <div className="grid grid-cols-2 gap-2">{([['audio', 'Audio', 'Micro uniquement', Mic], ['video', 'Vidéo', 'Caméra + micro', Video]] as const).map(([k, l, d, I]) => <button key={k} type="button" onClick={() => setKind(k)} aria-pressed={kind === k} className={`flex flex-col items-center gap-1 rounded-xl border p-4 text-sm transition ${kind === k ? 'border-primary bg-primary/10 ring-2 ring-primary/30' : 'bg-background/40'}`}><I className="size-6" /><span className="font-semibold">{l}</span><span className="text-xs text-muted-foreground">{d}</span></button>)}</div>
        </section>
        <section className={card}><h3 className="mb-3 font-semibold">Créer la salle</h3>
          <label className="mb-1 block text-xs text-muted-foreground" htmlFor="live-title">Titre du LIVE</label>
          <input id="live-title" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="Discussion avec la communauté" className="w-full rounded-xl border bg-background p-3 text-base" />
          <p className="mb-2 mt-4 text-xs text-muted-foreground">Catégorie</p>
          <div className="flex flex-wrap gap-2">{GENRES.map(g => <button key={g} type="button" onClick={() => setGenre(genre === g ? '' : g)} className={`rounded-full border px-3 py-1.5 text-xs ${genre === g ? 'border-primary bg-primary text-primary-foreground' : 'bg-background/40'}`}>{g}</button>)}</div>
        </section>
        <section className={card}><h3 className="mb-1 font-semibold">Règles du LIVE</h3>
          {([['visibility', 'Visibilité', [['public', 'Public'], ['followers', 'Abonnés'], ['private', 'Privé / sur invitation']]], ['join_policy', 'Qui peut demander à monter ?', [['everyone', 'Tout le monde'], ['followers', 'Abonnés uniquement'], ['nobody', 'Personne']]]] as const).map(([k, l, opts]) => <label key={k} className="flex items-center justify-between gap-3 border-b py-3 text-sm"><span>{l}</span><select value={cfg[k]} onChange={e => setCfg(c => ({ ...c, [k]: e.target.value }))} className="max-w-[55%] rounded-lg border bg-background p-2">{opts.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>)}
          <label className="flex items-center justify-between gap-3 border-b py-3 text-sm"><span>Places invités</span><select value={cfg.guest_slots} onChange={e => setCfg(c => ({ ...c, guest_slots: Number(e.target.value) as LiveSettings['guest_slots'] }))} className="rounded-lg border bg-background p-2">{GUEST_SLOTS.map(n => <option key={n} value={n}>{n} invité{n > 1 ? 's' : ''}</option>)}</select></label>
          {([['comments_enabled', 'Autoriser les commentaires'], ['gifts_enabled', 'Autoriser les cadeaux'], ['strict_spam', 'Filtre anti-spam renforcé']] as const).map(([k, l]) => <label key={k} className="flex items-center justify-between gap-3 border-b py-3 text-sm last:border-0"><span>{l}</span><input type="checkbox" className="size-5 accent-primary" checked={cfg[k]} onChange={e => setCfg(c => ({ ...c, [k]: e.target.checked }))} /></label>)}
        </section>
        <Button size="lg" className="h-12 w-full rounded-full" disabled={!title.trim()} onClick={() => setStep(1)}>Vérifier les appareils</Button>
      </>}
      {step === 1 && <>
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/60 bg-gradient-to-br from-primary/30 via-muted to-card">
          {kind === 'video' ? <video ref={videoRef} autoPlay muted playsInline className={`aspect-[3/4] w-full object-cover sm:aspect-video ${camOn ? '' : 'invisible'}`} /> : <div className="aspect-[4/3] sm:aspect-video" />}
          {(kind === 'audio' || !camOn) && <div className="absolute inset-0 grid place-items-center"><span className="grid size-24 place-items-center rounded-full border-4 border-background/40 bg-primary text-2xl font-extrabold text-primary-foreground">{kind === 'audio' ? <Mic className="size-10" /> : 'VOUS'}</span></div>}
          <span className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-[11px] font-semibold backdrop-blur">APERÇU LOCAL</span>
          <span className="absolute bottom-3 left-3 rounded-full bg-background/80 px-3 py-1.5 text-xs backdrop-blur">{kind === 'video' && `${camOn ? 'Caméra prête' : 'Caméra coupée'} · `}{micOn ? 'micro prêt' : 'micro coupé'}</span>
        </div>
        <div className="flex gap-2">
          {kind === 'video' && <Button variant={camOn ? 'secondary' : 'destructive'} className="flex-1 rounded-full" onClick={() => toggle('video')}><Video /> {camOn ? 'Couper caméra' : 'Caméra'}</Button>}
          <Button variant={micOn ? 'secondary' : 'destructive'} className="flex-1 rounded-full" onClick={() => toggle('audio')}><Mic /> {micOn ? 'Couper micro' : 'Micro'}</Button>
        </div>
        <ul className={`${card} divide-y`}><Row ok={checks.mic} label="Microphone" />{kind === 'video' && <Row ok={checks.cam} label="Caméra" />}<Row ok={checks.net} label="Connexion internet" /></ul>
        <div className="flex gap-2"><Button variant="outline" size="lg" className="h-12 flex-1 rounded-full" onClick={() => setStep(0)}>Retour</Button><Button size="lg" className="h-12 flex-1 rounded-full" onClick={() => setStep(2)}>Suivant</Button></div>
      </>}
      {step === 2 && <>
        <div className={`${card} flex items-center gap-3`}><span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">{kind === 'audio' ? <Mic className="size-5" /> : <Video className="size-5" />}</span><div className="min-w-0"><p className="truncate font-semibold">{title}</p><p className="text-sm text-muted-foreground">{kind === 'audio' ? 'Audio uniquement' : 'Vidéo'}{genre && ` · ${genre}`}</p></div></div>
        <section className={card}><h3 className="mb-3 font-semibold">Mode de diffusion</h3>
          <div className="grid gap-2 sm:grid-cols-2">{([['browser', 'Depuis ce navigateur', 'Webcam / micro, sans logiciel'], ['cloudflare', 'Via OBS (Cloudflare)', 'Nécessite la clé Cloudflare']] as const).map(([k, l, d]) => <button key={k} type="button" aria-pressed={via === k} onClick={() => setVia(k)} className={`rounded-xl border p-3 text-left text-sm ${via === k ? 'border-primary bg-primary/10 ring-2 ring-primary/30' : 'bg-background/40'}`}><span className="block font-semibold">{l}</span><span className="text-xs text-muted-foreground">{d}</span></button>)}</div>
        </section>
        <ol className="space-y-2">{[['Salle créée', 'Ton live reçoit son identifiant et ton rôle d’hôte.'], ['En direct', 'La salle devient visible aux spectateurs.']].map(([t, d], i) => <li key={t} className="flex gap-3 rounded-xl border bg-muted/40 p-3"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-sm font-extrabold text-primary">{i + 1}</span><span><b className="text-sm">{t}</b><br /><span className="text-xs text-muted-foreground">{d}</span></span></li>)}</ol>
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Wifi className="size-4" /> Les commandes de diffusion apparaîtront dans ton espace artiste.</p>
        <div className="flex gap-2"><Button variant="outline" size="lg" className="h-12 flex-1 rounded-full" onClick={() => setStep(1)}>Retour</Button>
          <Button size="lg" className="h-12 flex-[2] rounded-full" disabled={busy} onClick={async () => {
            setBusy(true);
            try {
              let liveId: string;
              if (via === 'cloudflare') liveId = (await start({ data: { title, kind, genre: genre || undefined, settings: cfg } })).id;
              else { const { data: u } = await supabase.auth.getUser(); if (!u.user) throw new Error('Session indisponible, recharge la page.'); const r = await supabase.from('lives').insert({ user_id: u.user.id, title: title.trim(), kind, genre: genre || null, ...cfg }).select('id').single(); if (r.error) throw new Error('Le live n’a pas pu démarrer.'); liveId = r.data.id; }
              streamRef.current?.getTracks().forEach(t => t.stop()); navigate({ to: '/live/$id', params: { id: liveId } });
            }
            catch (err) { toast.error(err instanceof Error ? err.message : 'Le live n’a pas pu démarrer.'); }
            finally { setBusy(false); }
          }}><Radio /> {busy ? 'Préparation…' : 'Démarrer le LIVE'}</Button></div>
      </>}
      </div>
    </div>
  </div>;
}
