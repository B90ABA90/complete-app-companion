import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Flag, Send, Trash2, AudioLines, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Avatar } from '@/shared/components/clip-avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useClipSession } from '@/shared/components/clip-session';
import { creatorName, formatCount, type ClipVideo } from '@/videos/lib/clip.types';
import { VinasoundVideoIntro } from './vinasound-video-intro';
import { AccountUnavailable } from '@/shared/components/clip-shell';
import { videoShareUrl } from '@/videos/lib/clip-share';
import { ShareTargets } from '@/shared/components/share-targets';
import { useVideoExpiry } from '@/videos/lib/use-video-expiry';
import { isSoundUnlocked, onSoundUnlock, playEndSignature } from '@/videos/lib/feed-sound';
import { VideoActionIcon } from './video-action-icon';
import { ArtistProfileLink } from './artist-profile-link';

export function VideoCard({ v }: { v: ClipVideo }) {
  const expired = useVideoExpiry(v.expires_at);
  if (expired) return <section className="video-surface flex h-[calc(100dvh-4rem)] snap-start items-center justify-center bg-background text-muted-foreground">Cette vidéo a expiré après 24 heures.</section>;
  return <NativeVideoCard v={v} />;
}
function useVideoSocial(v: ClipVideo) {
  const [comments, setComments] = useState(false);
  const [report, setReport] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const { user } = useClipSession();
  const qc = useQueryClient();
  const { data: liked = false } = useQuery({ queryKey: ['liked', user?.id, v.id], enabled: !!user, queryFn: async () => { const r = await supabase.from('likes').select('video_id').eq('video_id', v.id).eq('user_id', user?.id ?? '').maybeSingle(); if (r.error) throw r.error; return !!r.data; } });
  const like = async (onlyAdd = false) => {
    if (!user) { toast('Ton compte VINASOUND n’est pas encore relié à cet aperçu.'); return; }
    if (busy || (onlyAdd && liked)) return;
    setBusy(true);
    const r = liked ? await supabase.from('likes').delete().eq('user_id', user.id).eq('video_id', v.id) : await supabase.from('likes').upsert({ user_id: user.id, video_id: v.id }, { onConflict: 'user_id,video_id', ignoreDuplicates: true });
    setBusy(false);
    if (r.error) { toast.error('Impossible d’enregistrer ce j’aime.'); return; }
    qc.invalidateQueries({ queryKey: ['liked', user.id, v.id] }); qc.invalidateQueries({ queryKey: ['feed'] });
  };
  const [shareOpen, setShareOpen] = useState(false);
  const share = () => setShareOpen(true);
  const nativeShare = async () => { try { await navigator.share({ title: `VINASOUND — @${creatorName(v)}`, url: videoShareUrl(window.location.origin, v.id) }); } catch { /* cancelled */ } };
  return { user, liked, busy, like, share, shareOpen, setShareOpen, nativeShare, comments, setComments, report, setReport, reason, setReason, favorite, setFavorite };
}
function VideoActions({ v, social, playing, extra }: { v: ClipVideo; social: ReturnType<typeof useVideoSocial>; playing: boolean; extra?: ReactNode }) {
  const name = creatorName(v);
  return <>
    <aside aria-label="Actions de la vidéo" className="video-actions absolute bottom-14 right-3 z-10 flex w-12 flex-col items-center gap-3 text-video-action-foreground">
      <div className="relative mb-3 size-12">
        {v.user_id ? <ArtistProfileLink id={v.user_id} username={v.profiles?.username} label={`Profil de ${name}`} className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-video-action-background p-0 text-lg"><Avatar path={v.profiles?.avatar_path} name={name} className="flex size-full items-center justify-center" /></ArtistProfileLink> : <span className="flex size-12 items-center justify-center rounded-full bg-video-action-background font-bold">{name.charAt(0).toUpperCase()}</span>}
        <ArtistProfileLink id={v.user_id} username={v.profiles?.username} action="follow" label={`S’abonner à ${name} sur VINASOUND`} className="absolute -bottom-3 left-3 flex size-6 items-center justify-center rounded-full bg-video-follow p-0 text-video-action-foreground"><Plus className="size-5" strokeWidth={3}/></ArtistProfileLink>
      </div>
      <div className="flex flex-col items-center gap-1"><Button variant="ghost" size="icon" aria-label={social.liked ? 'Retirer le j’aime' : 'Aimer'} aria-pressed={social.liked} disabled={social.busy} onClick={() => social.like()} className="size-12 rounded-full bg-video-action-background p-0 text-video-action-foreground hover:bg-video-action-background [&_svg]:size-6"><VideoActionIcon kind="heart" className={social.liked ? 'animate-pop text-video-follow' : ''}/></Button><span className="text-xs font-bold text-video-action-count">{formatCount(v.likes[0]?.count ?? 0)}</span></div>
      <div className="flex flex-col items-center gap-1"><Button variant="ghost" size="icon" aria-label="Commentaires" onClick={() => social.setComments(true)} className="size-12 rounded-full bg-video-action-background p-0 text-video-action-foreground hover:bg-video-action-background [&_svg]:size-6"><VideoActionIcon kind="comment"/></Button><span className="text-xs font-bold text-video-action-count">{formatCount(v.comments[0]?.count ?? 0)}</span></div>
      <div className="flex flex-col items-center gap-1"><Button variant="ghost" size="icon" aria-label={social.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} aria-pressed={social.favorite} onClick={() => social.setFavorite(!social.favorite)} className="size-12 rounded-full bg-video-action-background p-0 text-video-action-foreground hover:bg-video-action-background [&_svg]:size-6"><VideoActionIcon kind="bookmark" className={social.favorite ? 'text-primary' : ''}/></Button><span className="text-xs font-bold text-video-action-count">{social.favorite ? 1 : 0}</span></div>
      <div className="flex flex-col items-center gap-1"><Button variant="ghost" size="icon" aria-label="Partager" onClick={social.share} className="size-12 rounded-full bg-video-action-background p-0 text-video-action-foreground hover:bg-video-action-background [&_svg]:size-6"><VideoActionIcon kind="share"/></Button><span className="text-xs font-bold text-video-action-count">Partager</span></div>
      {v.user_id && <ArtistProfileLink id={v.user_id} username={v.profiles?.username} label={`Profil artiste : ${name}`} className="video-record mt-1 flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-video-action-background p-1.5 text-sm hover:bg-video-action-background"><span data-playing={playing} className="video-record-photo flex size-full items-center justify-center overflow-hidden rounded-full"><Avatar path={v.profiles?.avatar_path} name={name} className="flex size-full items-center justify-center"/></span></ArtistProfileLink>}
      {extra}
    </aside>
    <Dialog open={social.shareOpen} onOpenChange={social.setShareOpen}><DialogContent aria-describedby={undefined} className="max-w-sm"><DialogTitle>Partager la vidéo</DialogTitle><ShareTargets title={v.caption || 'VINASOUND'} text={`Regarde cette vidéo de @${name} sur VINASOUND`} url={typeof window === 'undefined' ? '' : videoShareUrl(window.location.origin, v.id)} onNative={social.nativeShare} /><Button variant="ghost" onClick={() => { social.setShareOpen(false); if (social.user) social.setReport(true); else toast('Ton compte VINASOUND n’est pas encore relié à cet aperçu.'); }}><Flag/>Signaler la vidéo</Button></DialogContent></Dialog>
    <CommentSheet v={v} open={social.comments} onClose={() => social.setComments(false)} />
    <Dialog open={social.report} onOpenChange={social.setReport}><DialogContent aria-describedby={undefined} className="max-w-sm"><DialogTitle>Signaler cette vidéo</DialogTitle><form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (!social.user || !social.reason.trim()) return; const r = await supabase.from('reports').insert({ user_id: social.user.id, video_id: v.id, reason: social.reason.trim() }); if (r.error) toast.error('Signalement non envoyé.'); else { toast.success('Signalement enregistré'); social.setReport(false); social.setReason(''); } }}><textarea required maxLength={500} value={social.reason} onChange={e => social.setReason(e.target.value)} aria-label="Motif du signalement" placeholder="Motif du signalement" className="w-full rounded-md bg-muted p-3" /><Button type="submit">Envoyer le signalement</Button></form></DialogContent></Dialog>
  </>;
}
function NativeVideoCard({ v }: { v: ClipVideo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const visible = useRef(false);
  const retries = useRef(0);
  const social = useVideoSocial(v);
  const qc = useQueryClient();
  const name = creatorName(v);
  const start = () => {
    const el = ref.current;
    if (!el) return;
    el.muted = !isSoundUnlocked();
    el.play().then(() => { setPaused(false); retries.current = 0; }).catch(() => { el.muted = true; el.play().then(() => setPaused(false)).catch(() => setPaused(true)); });
  };
  // Keep the playing address stable: the feed refreshes periodically and issues a new
  // signed URL each time; swapping src mid-playback restarts the video from 0.
  const [src, setSrc] = useState(v.video_url);
  const needFresh = useRef(false);
  const resumeAt = useRef(0);
  const retry = () => {
    const el = ref.current;
    if (!el || !visible.current) return;
    if (el.currentTime > 0) resumeAt.current = el.currentTime;
    if (retries.current < 3) {
      retries.current += 1;
      const at = resumeAt.current;
      el.addEventListener('loadedmetadata', () => { if (at > 0) el.currentTime = at; }, { once: true });
      el.load();
      start();
    }
    else { needFresh.current = true; qc.invalidateQueries({ queryKey: ['feed'] }); }
  };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { visible.current = !!e?.isIntersecting; if (visible.current) start(); else el.pause(); }, { threshold: 0.6 });
    io.observe(el);
    const off = onSoundUnlock(() => { if (visible.current) { el.muted = false; if (el.paused) start(); } });
    return () => { io.disconnect(); off(); el.pause(); };
  }, []);
  useEffect(() => {
    if (!v.video_url || v.video_url === src) return;
    if (!src || needFresh.current) { needFresh.current = false; retries.current = 0; setSrc(v.video_url); }
  }, [v.video_url]);
  useEffect(() => {
    const el = ref.current;
    if (!el || !resumeAt.current) return;
    const at = resumeAt.current;
    el.addEventListener('loadedmetadata', () => { el.currentTime = at; if (visible.current) start(); }, { once: true });
  }, [src]);
  const toggle = () => { const el = ref.current; if (!el) return; if (el.paused) el.play().then(() => setPaused(false)).catch(() => toast.error('Lecture indisponible.')); else { el.pause(); setPaused(true); } };
  const ended = () => {
    const el = ref.current; if (!el) return;
    setPlaying(false);
    if (!el.muted) playEndSignature();
    setTimeout(() => { if (visible.current) { el.currentTime = 0; el.play().then(() => setPaused(false)).catch(() => retry()); } }, 1500);
  };
  return <section className="video-surface relative h-[calc(100dvh-4rem)] snap-start overflow-hidden bg-background">
    <video ref={ref} src={src} preload="auto" playsInline controls className="h-full w-full object-contain" onPlay={() => setPaused(false)} onPlaying={() => { setPlaying(true); setBuffering(false); }} onCanPlay={() => setBuffering(false)} onWaiting={() => { setPlaying(false); setBuffering(true); }} onStalled={() => { setPlaying(false); setBuffering(true); const el = ref.current; setTimeout(() => { if (el && visible.current && !el.ended && el.readyState < 3) el.play().catch(() => {}); }, 2500); }} onSeeking={() => setPlaying(false)} onPause={() => { setPaused(true); setPlaying(false); }} onError={() => { setPlaying(false); const el = ref.current; if (el?.error && (el.error.code === 2 || el.error.code === 3)) retry(); else setPaused(true); }} onEnded={ended} onDoubleClick={() => social.like(true)} aria-label={`Vidéo de ${name}`} />
    {buffering && !paused && <Loader2 aria-label="Chargement de la vidéo" className="pointer-events-none absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 animate-spin text-foreground" />}
    {paused && <Button variant="ghost" size="icon" aria-label="Lire la vidéo" className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2" onClick={toggle}><Play className="size-12 fill-foreground" /></Button>}
    <VinasoundVideoIntro />
    <span aria-label="VINASOUND" className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-md bg-brand-ink/80 text-primary shadow-lg"><AudioLines className="size-6" /></span>
    <div className="video-caption absolute bottom-20 left-3 right-20 z-10 text-foreground"><p className="break-words text-sm font-semibold">{name}</p><p className="line-clamp-2 break-words text-sm" title={v.caption}>{v.caption}</p>{v.is_example && <p className="text-xs">Vidéo d’exemple</p>}</div>
    <VideoActions v={v} social={social} playing={playing} />
  </section>;
}
type ClipComment = { id: string; body: string; user_id: string; parent_id: string | null; created_at: string; profiles: { username: string; avatar_path: string } | null };
function CommentSheet({ v, open, onClose }: { v: ClipVideo; open: boolean; onClose: () => void }) {
  const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [limit, setLimit] = useState(100);
  const [replyTo, setReplyTo] = useState<ClipComment | null>(null); const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { user } = useClipSession(); const qc = useQueryClient();
  const { data = [], isPending } = useQuery({ queryKey: ['comments', v.id, limit], enabled: open, queryFn: async () => { const r = await supabase.from('comments').select('id,body,user_id,parent_id,created_at,profiles(username,avatar_path)').eq('video_id', v.id).order('created_at', { ascending: true }).limit(limit); if (r.error) throw r.error; return r.data as ClipComment[]; } });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['comments', v.id] }); qc.invalidateQueries({ queryKey: ['feed'] }); };
  const roots = data.filter(c => !c.parent_id).reverse();
  const replies = (id: string) => data.filter(c => c.parent_id === id);
  const row = (c: ClipComment, rootId: string, small = false) => <div key={c.id} className="flex gap-3"><Avatar path={c.profiles?.avatar_path} name={c.profiles?.username ?? ''} className={`flex shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground ${small ? 'size-6 text-xs' : 'size-8'}`} /><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">@{c.profiles?.username}</p><p className="break-words text-sm">{c.body}</p>{user && <button type="button" className="mt-1 text-xs font-semibold text-muted-foreground" onClick={() => { setReplyTo({ ...c, id: rootId, body: c.profiles?.username ?? '' }); setText(rootId !== c.id ? `@${c.profiles?.username} ` : ''); setExpanded(e => ({ ...e, [rootId]: true })); }}>Répondre</button>}</div>{c.user_id === user?.id && <Button variant="ghost" size="icon" aria-label="Supprimer le commentaire" onClick={async () => { const r = await supabase.from('comments').delete().eq('id', c.id); if (r.error) toast.error('Suppression impossible.'); else refresh(); }}><Trash2 /></Button>}</div>;
  return <Dialog open={open} onOpenChange={o => !o && onClose()}><DialogContent aria-describedby={undefined} className="flex max-h-[80dvh] max-w-md flex-col"><DialogTitle>Commentaires · {v.comments[0]?.count ?? 0}</DialogTitle><ul className="min-h-40 flex-1 space-y-4 overflow-y-auto">{isPending ? <li>Chargement…</li> : roots.length === 0 ? <li className="py-8 text-center text-muted-foreground">Sois le premier à commenter</li> : roots.map(c => { const rs = replies(c.id); return <li key={c.id} className="space-y-2">{row(c, c.id)}{rs.length > 0 && <div className="ml-11 space-y-2 border-l pl-3">{expanded[c.id] ? rs.map(r => row(r, c.id, true)) : null}<button type="button" className="text-xs font-semibold text-muted-foreground" onClick={() => setExpanded(e => ({ ...e, [c.id]: !e[c.id] }))}>{expanded[c.id] ? 'Masquer les réponses' : `Voir ${rs.length} réponse${rs.length > 1 ? 's' : ''}`}</button></div>}</li>; })}</ul>{data.length === limit && <Button variant="ghost" onClick={() => setLimit(limit + 100)}>Voir plus</Button>}{user ? <div className="border-t pt-3">{replyTo && <p className="mb-2 flex items-center justify-between text-xs text-muted-foreground">Réponse à @{replyTo.body}<button type="button" className="font-semibold" onClick={() => { setReplyTo(null); setText(''); }}>Annuler</button></p>}<form className="flex gap-2" onSubmit={async e => { e.preventDefault(); if (!text.trim() || busy) return; setBusy(true); try { const r = await supabase.from('comments').insert({ user_id: user.id, video_id: v.id, body: text.trim(), parent_id: replyTo?.id ?? null }); if (r.error) { toast.error('Commentaire non envoyé. Réessaie dans un instant.'); return; } setText(''); setReplyTo(null); onClose(); refresh(); } catch { toast.error('Commentaire non envoyé. Réessaie dans un instant.'); } finally { setBusy(false); } }}><input required maxLength={1000} value={text} onChange={e => setText(e.target.value)} placeholder={replyTo ? 'Écrire une réponse…' : 'Ajouter un commentaire…'} aria-label="Ajouter un commentaire" className="min-w-0 flex-1 rounded-full bg-muted px-4 py-2 text-sm" /><Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="Envoyer le commentaire"><Send /></Button></form></div> : <AccountUnavailable />}</DialogContent></Dialog>;
}