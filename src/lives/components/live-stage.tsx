import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Hand, Check, X, LogOut, UserMinus, Share2, UserPlus, UserCheck, Clock, Link2Off, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { BroadcasterPanel, ViewerPlayer } from '@/lives/components/browser-live';
import { canRequestStage, hasFreeSlot, formatDuration } from '@/lives/lib/live';

export type JoinRequest = { id: string; user_id: string; status: string; created_at: string; profiles: { username: string } | null };
type LiveRow = { id: string; user_id: string; join_policy: string; guest_slots: number; slow_mode_seconds: number; block_links: boolean; created_at: string; ended_at: string | null; like_count: number; max_viewers: number; kind: string };

export const requestsKey = (id: string) => ['live-requests', id] as const;
export function useJoinRequests(liveId: string) {
  return useQuery({ queryKey: requestsKey(liveId), queryFn: async () => { const r = await supabase.from('live_join_requests').select('id,user_id,status,created_at,profiles!live_join_requests_user_id_fkey(username)').eq('live_id', liveId).in('status', ['pending', 'accepted']).order('created_at'); if (r.error) throw r.error; return r.data as JoinRequest[]; } });
}

const errMsg = (e: { message: string } | null, fallback: string) => e ? (/places/.test(e.message) ? 'Toutes les places invités sont prises.' : /fermées/.test(e.message) ? 'L’hôte n’accepte pas de demandes.' : /abonnés/i.test(e.message) ? 'Réservé aux abonnés de l’artiste.' : /duplicate|unique/.test(e.message) ? 'Demande déjà envoyée.' : fallback) : '';

export function FollowShare({ hostId, userId, title, compact = false }: { hostId: string; userId?: string | undefined; title: string; compact?: boolean }) {
  const qc = useQueryClient();
  const { data: following = false } = useQuery({ queryKey: ['follow', userId, hostId], enabled: !!userId && userId !== hostId, queryFn: async () => { if (!userId) return false; const r = await supabase.from('follows').select('followed_id').eq('follower_id', userId).eq('followed_id', hostId).maybeSingle(); return !!r.data; } });
  const share = async () => { const url = window.location.href; try { if (navigator.share) await navigator.share({ title, url }); else { await navigator.clipboard.writeText(url); toast.success('Lien du live copié'); } } catch { /* partage annulé */ } };
  return <div className="flex gap-2">
    {userId && userId !== hostId && <Button size="sm" variant={following ? 'secondary' : compact ? 'destructive' : 'default'} className={compact ? 'h-7 rounded-full px-2.5 text-xs' : 'rounded-full'} onClick={async () => {
      const r = following ? await supabase.from('follows').delete().eq('follower_id', userId).eq('followed_id', hostId) : await supabase.from('follows').insert({ follower_id: userId, followed_id: hostId });
      if (r.error) toast.error('Action impossible.'); else qc.invalidateQueries({ queryKey: ['follow', userId, hostId] });
    }}>{following ? <UserCheck /> : compact ? null : <UserPlus />}{following ? 'Abonné' : compact ? '+ Abonnement' : 'Suivre'}</Button>}
     {!compact && <Button size="sm" variant="outline" className="rounded-full" onClick={share}><Share2 />Partager</Button>}
  </div>;
}

/** Viewer side: request, wait, then go on stage with own camera/mic. */
export function ViewerStage({ live, userId, requests, audioOnly }: { live: LiveRow; userId: string; requests: JoinRequest[]; audioOnly: boolean }) {
  const qc = useQueryClient(); const [busy, setBusy] = useState(false);
  const mine = requests.find(r => r.user_id === userId);
  const accepted = requests.filter(r => r.status === 'accepted').length;
  const { data: isFollower = false } = useQuery({ queryKey: ['follow', userId, live.user_id], queryFn: async () => { const r = await supabase.from('follows').select('followed_id').eq('follower_id', userId).eq('followed_id', live.user_id).maybeSingle(); return !!r.data; } });
  const set = async (status: 'cancelled' | 'left') => { if (!mine) return; setBusy(true); const r = await supabase.from('live_join_requests').update({ status }).eq('id', mine.id); setBusy(false); if (r.error) toast.error('Action impossible.'); qc.invalidateQueries({ queryKey: requestsKey(live.id) }); };
  if (mine?.status === 'accepted') return <div className="space-y-2 rounded-2xl border border-primary/50 bg-primary/5 p-4 text-sm">
    <p className="font-semibold">Tu es invité sur scène 🎤</p>
    <BroadcasterPanel liveId={live.id} audioOnly={audioOnly} publisher={userId} label="Rejoindre la scène" />
    <Button variant="destructive" size="sm" className="rounded-full" disabled={busy} onClick={() => set('left')}><LogOut />Quitter la scène</Button>
  </div>;
  if (mine?.status === 'pending') return <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 text-sm"><span className="flex items-center gap-2"><Clock className="size-4 animate-pulse text-primary" />Demande envoyée, en attente de l’hôte…</span><Button size="sm" variant="outline" className="rounded-full" disabled={busy} onClick={() => set('cancelled')}>Annuler</Button></div>;
  const allowed = canRequestStage(live.join_policy as 'everyone', isFollower); const free = hasFreeSlot(live.guest_slots, accepted);
  return <Button variant="outline" className="w-full rounded-full sm:w-auto" disabled={busy || !allowed || !free} onClick={async () => {
    setBusy(true); const r = await supabase.from('live_join_requests').insert({ live_id: live.id, user_id: userId }); setBusy(false);
    if (r.error) toast.error(errMsg(r.error, 'Demande non envoyée.')); else toast.success('Demande envoyée à l’hôte');
    qc.invalidateQueries({ queryKey: requestsKey(live.id) });
  }}><Hand />{!allowed ? (live.join_policy === 'nobody' ? 'Demandes fermées' : 'Réservé aux abonnés') : !free ? 'Scène complète' : 'Demander à monter'}</Button>;
}

/** Host side: queue of requests and guests on stage. */
export function HostRequests({ live, requests }: { live: LiveRow; requests: JoinRequest[] }) {
  const qc = useQueryClient();
  const pending = requests.filter(r => r.status === 'pending'); const guests = requests.filter(r => r.status === 'accepted');
  const act = async (id: string, status: 'accepted' | 'rejected' | 'removed') => { const r = await supabase.from('live_join_requests').update({ status }).eq('id', id); if (r.error) toast.error(errMsg(r.error, 'Action impossible.')); qc.invalidateQueries({ queryKey: requestsKey(live.id) }); };
  return <div className="space-y-2">
    <p className="font-semibold">Demandes pour monter <span className="text-muted-foreground">· {guests.length}/{live.guest_slots} places</span></p>
    {pending.length === 0 && <p className="text-xs text-muted-foreground">{live.join_policy === 'nobody' ? 'Les demandes sont fermées pour ce live.' : 'Aucune demande pour l’instant.'}</p>}
    <ul className="space-y-2">{pending.map(r => <li key={r.id} className="flex items-center gap-2 rounded-xl border bg-background/60 p-2"><span className="min-w-0 flex-1 truncate">@{r.profiles?.username}</span>
      <Button size="icon" className="size-8 rounded-full" aria-label="Accepter" disabled={!hasFreeSlot(live.guest_slots, guests.length)} onClick={() => act(r.id, 'accepted')}><Check /></Button>
      <Button size="icon" variant="outline" className="size-8 rounded-full" aria-label="Refuser" onClick={() => act(r.id, 'rejected')}><X /></Button></li>)}</ul>
    {guests.length > 0 && <ul className="space-y-2">{guests.map(r => <li key={r.id} className="flex items-center gap-2 rounded-xl bg-primary/10 p-2"><span className="min-w-0 flex-1 truncate">🎤 @{r.profiles?.username}</span><Button size="sm" variant="ghost" onClick={() => act(r.id, 'removed')}><UserMinus />Retirer</Button></li>)}</ul>}
  </div>;
}

/** Guests on stage, visible to everyone (each guest publishes directly). */
export function GuestTiles({ liveId, guests, selfId, audioOnly }: { liveId: string; guests: JoinRequest[]; selfId?: string | undefined; audioOnly: boolean }) {
  const others = guests.filter(g => g.user_id !== selfId);
  if (!others.length) return null;
  return <div className="live-guest-grid" style={{ gridTemplateRows: `repeat(${Math.max(2, others.length)}, minmax(0, 1fr))` }}>
    {others.map(g => <div key={g.id} className="live-guest-tile video-surface relative min-h-0 overflow-hidden rounded-lg bg-muted">
      <ViewerPlayer liveId={liveId} audioOnly={audioOnly} publisher={g.user_id} waiting="Connexion de l’invité…" />
      {audioOnly && <div className="absolute inset-0 grid place-items-center text-3xl font-bold">{g.profiles?.username?.[0]?.toUpperCase()}</div>}
      <span className="absolute bottom-2 left-2 z-10 rounded-full bg-background/80 px-2 py-0.5 text-xs backdrop-blur">🎤 @{g.profiles?.username}</span>
    </div>)}
  </div>;
}

export function ModerationTools({ live }: { live: LiveRow }) {
  const qc = useQueryClient();
  const upd = async (patch: { slow_mode_seconds?: number; block_links?: boolean }) => { const r = await supabase.from('lives').update(patch).eq('id', live.id); if (r.error) toast.error('Réglage non appliqué.'); else { toast.success('Réglage appliqué'); qc.invalidateQueries({ queryKey: ['live', live.id] }); } };
  return <div className="space-y-2">
    <p className="font-semibold">Modération</p>
    <label className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Clock className="size-4" />Mode lent</span><select value={live.slow_mode_seconds} onChange={e => upd({ slow_mode_seconds: Number(e.target.value) })} className="rounded-lg border bg-background p-1.5">{[0, 5, 10, 30, 60].map(n => <option key={n} value={n}>{n ? `${n} s` : 'Désactivé'}</option>)}</select></label>
    <label className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Link2Off className="size-4" />Filtrer les liens</span><input type="checkbox" className="size-5 accent-primary" checked={live.block_links} onChange={e => upd({ block_links: e.target.checked })} /></label>
  </div>;
}

export function EndSummary({ live, gifts }: { live: LiveRow; gifts: number }) {
  const dur = live.ended_at ? new Date(live.ended_at).getTime() - new Date(live.created_at).getTime() : 0;
  return <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
    <Trophy className="size-10 text-primary" /><p className="text-lg font-bold">Ce live est terminé</p>
    <dl className="grid w-full max-w-sm grid-cols-2 gap-2 text-sm">{([['Durée', formatDuration(dur)], ['Spectateurs max', live.max_viewers], ['Likes', live.like_count], ['Cadeaux (crédits)', gifts]] as const).map(([k, v]) => <div key={k} className="rounded-xl bg-background/70 p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="text-lg font-bold">{v}</dd></div>)}</dl>
  </div>;
}
