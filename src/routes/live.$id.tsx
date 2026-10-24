import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { giftArt } from '@/lives/lib/gift-art';
import { playGiftSound } from '@/lives/lib/gift-sound';
import { ShareTargets } from '@/shared/components/share-targets';
import loveImg from '@/assets/gifts/love.png';
import { Heart, Gift, Send, EyeOff, Ban, Users, ArrowLeft, Square, MessageSquareOff, Eye, X, ChevronDown, Share2, Settings2, MoreHorizontal, Smile, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useClipSession } from '@/shared/components/clip-session';
import { Avatar } from '@/shared/components/clip-avatar';
import { Button } from '@/components/ui/button';
import { LiveSheet } from '@/lives/components/live-sheet';
import { ClipSidebar } from '@/shared/components/clip-shell';
import { BroadcasterPanel, ViewerPlayer } from '@/lives/components/browser-live';
import { AudioDoctor } from '@/lives/components/audio-doctor';
import { isStreamUrl, LIKE_BATCH_MAX } from '@/lives/lib/live';
import { useServerFn } from '@tanstack/react-start';
import { summarizeLiveChat, type ChatInsight } from '@/lives/lib/live-ai.functions';
import { Sparkles, AlertTriangle, Flag } from 'lucide-react';
import { useJoinRequests, requestsKey, FollowShare, ViewerStage, HostRequests, GuestTiles, ModerationTools, EndSummary } from '@/lives/components/live-stage';

export const Route = createFileRoute('/live/$id')({
  head: () => ({ meta: [{ title: 'VINASOUND — Live en direct' }, { name: 'description', content: 'Live d’artiste sur VINASOUND : chat, likes et cadeaux en direct.' }, { property: 'og:title', content: 'VINASOUND — Live en direct' }, { property: 'og:description', content: 'Live d’artiste sur VINASOUND : chat, likes et cadeaux en direct.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: Page,
});

type Burst = { key: number; emoji: string; who: string; art?: string | undefined; from: string };

function Page() {
  const { id } = Route.useParams(); const { user } = useClipSession(); const qc = useQueryClient();
  const [text, setText] = useState(''); const [viewers, setViewers] = useState(0);
  const [conn, setConn] = useState<'connexion' | 'ok' | 'erreur'>('connexion');
  const [pending, setPending] = useState(0); const [bursts, setBursts] = useState<Burst[]>([]);
  const [studioOpen, setStudioOpen] = useState(false); const [guestOpen, setGuestOpen] = useState(false); const [moreOpen, setMoreOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false); const [shareOpen, setShareOpen] = useState(false); const [chosen, setChosen] = useState<string | null>(null); const [sending, setSending] = useState(false);
  const [picked, setPicked] = useState<string[]>([]); const [insight, setInsight] = useState<ChatInsight | null>(null); const [analysing, setAnalysing] = useState(false); const summarize = useServerFn(summarizeLiveChat);
  const navigate = useNavigate(); const pendingRef = useRef(0); const refRef = useRef<string>(crypto.randomUUID());
  const chatRef = useRef<HTMLDivElement>(null); const stick = useRef(true); const [attempt, setAttempt] = useState(0); const [hostStream, setHostStream] = useState<MediaStream | null>(null); const selfRef = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (selfRef.current) selfRef.current.srcObject = hostStream; }, [hostStream]); const [confirmEnd, setConfirmEnd] = useState(false);
  const { data: requests = [] } = useJoinRequests(id);
  const [hearts, setHearts] = useState<{ key: number; x: number; d: number }[]>([]);
  const [present, setPresent] = useState<{ key: string; name: string }[]>([]); const [peopleOpen, setPeopleOpen] = useState(false);
  const [arrivals, setArrivals] = useState<{ key: string; name: string; at: string }[]>([]);
  const [likers, setLikers] = useState<{ key: string; name: string; n: number; at: string }[]>([]);
  const addLiker = (key: string, name: string, n: number) => setLikers(l => { const prev = l.find(x => x.key === key); return [...l.filter(x => x.key !== key), { key, name, n: (prev?.n ?? 0) + n, at: new Date().toISOString() }].slice(-15); });
  const { data: me } = useQuery({ queryKey: ['me-profile', user?.id], enabled: !!user, queryFn: async () => (await supabase.from('profiles').select('username').eq('id', user!.id).maybeSingle()).data });
  // Anonymous visitors opening a shared link get a stable, unique spectator name so the host can tell them apart.
  const anonName = useRef(`Spectateur ${Math.floor(1000 + Math.random() * 9000)}`);
  const meName = useRef('Spectateur'); meName.current = me?.username ?? (user ? 'Spectateur' : anonName.current); const chRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  useEffect(() => { if (me?.username) chRef.current?.track({ at: Date.now(), name: me.username }); }, [me?.username]);
  const popHearts = (n = 1) => { const items = Array.from({ length: Math.min(n, 6) }, (_, i) => ({ key: Date.now() + Math.random() + i, x: Math.random() * 30 - 15, d: i * 140 })); setHearts(h => [...h.slice(-20), ...items]); setTimeout(() => setHearts(h => h.filter(x => !items.includes(x))), 2600); };
  const lastLikes = useRef<number | null>(null);

  const { data: live } = useQuery({ queryKey: ['live', id], queryFn: async () => { const r = await supabase.from('lives').select('*,profiles!lives_user_id_fkey(username,avatar_path)').eq('id', id).maybeSingle(); if (r.error) throw r.error; return r.data; } });
  const { data: messages = [] } = useQuery({ queryKey: ['live-messages', id], queryFn: async () => { const r = await supabase.from('live_messages').select('*,profiles!live_messages_user_id_fkey(username,avatar_path)').eq('live_id', id).order('created_at', { ascending: false }).limit(100); if (r.error) throw r.error; return r.data.reverse(); } });
  const { data: gifts = [] } = useQuery({ queryKey: ['gifts'], queryFn: async () => { const r = await supabase.from('gifts').select('*').order('sort'); if (r.error) throw r.error; return r.data; } });
  const { data: freeMode = true } = useQuery({ queryKey: ['gift-settings'], queryFn: async () => (await supabase.from('gift_settings').select('free_mode').maybeSingle()).data?.free_mode ?? true });
  const { data: balance } = useQuery({ queryKey: ['wallet', user?.id], enabled: !!user, queryFn: async () => { const r = await supabase.rpc('ensure_wallet'); if (r.error) throw r.error; return r.data; } });
  const owner = !!user && live?.user_id === user.id;
  const { data: keys } = useQuery({ queryKey: ['live-key', id], enabled: owner, queryFn: async () => { const r = await supabase.from('live_stream_keys').select('rtmps_url,stream_key').eq('live_id', id).maybeSingle(); if (r.error) throw r.error; return r.data; } });
  const { data: received = [] } = useQuery({ queryKey: ['live-gifts', id], queryFn: async () => { const r = await supabase.from('gift_sends').select('*,profiles!gift_sends_sender_id_fkey(username),gifts(emoji,name)').eq('live_id', id).order('created_at', { ascending: false }).limit(50); if (r.error) throw r.error; return r.data; } });

  useEffect(() => {
    let retry: ReturnType<typeof setTimeout> | undefined;
    const ch = supabase.channel(`live-${id}`, { config: { presence: { key: user?.id ?? `anon-${crypto.randomUUID()}` } } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_messages', filter: `live_id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: ['live-messages', id] }))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lives', filter: `id=eq.${id}` }, p => qc.setQueryData(['live', id], (old: any) => old ? { ...old, ...p.new } : old))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gift_sends', filter: `live_id=eq.${id}` }, async p => {
        const g = (qc.getQueryData(['gifts']) as any[] | undefined)?.find(x => x.id === (p.new as { gift_id?: string }).gift_id);
        const key = Date.now() + Math.random();
        const gid = (p.new as { gift_id?: string }).gift_id; const sid = (p.new as { sender_id?: string }).sender_id;
        const from = sid ? (await supabase.from('profiles').select('username').eq('id', sid).maybeSingle()).data?.username ?? 'Spectateur' : 'Spectateur';
        setBursts(b => [...b.slice(-4), { key, emoji: g?.emoji ?? '🎁', who: g?.name ?? 'Cadeau', art: giftArt(gid), from }]);
        setTimeout(() => setBursts(b => b.filter(x => x.key !== key)), 3600); playGiftSound((g?.price ?? 0) >= 50);
        qc.invalidateQueries({ queryKey: ['live-gifts', id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_join_requests', filter: `live_id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: requestsKey(id) }))
      .on('broadcast', { event: 'like' }, ({ payload }) => { const p = payload as { key?: string; name?: string; n?: number }; popHearts(Math.min(p.n ?? 1, 6)); addLiker(p.key ?? 'anon', p.name ?? 'Un spectateur', p.n ?? 1); })
      .on('presence', { event: 'sync' }, () => { const st = ch.presenceState() as Record<string, { name?: string }[]>; setViewers(Object.keys(st).length); setPresent(Object.entries(st).map(([key, v]) => ({ key, name: v[0]?.name ?? 'Spectateur' }))); })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => { const name = (newPresences[0] as { name?: string } | undefined)?.name ?? 'Un spectateur'; setArrivals(a => [...a.filter(x => x.key !== key), { key, name, at: new Date().toISOString() }].slice(-15)); })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') { setConn('ok'); setAttempt(0); qc.invalidateQueries({ queryKey: requestsKey(id) }); chRef.current = ch; await ch.track({ at: Date.now(), name: meName.current }); qc.invalidateQueries({ queryKey: ['live-messages', id] }); }
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { setConn('erreur'); retry = setTimeout(() => setAttempt(a => a + 1), Math.min(30000, 1000 * 2 ** Math.min(attempt, 5))); }
        else if (status === 'CLOSED') setConn('connexion');
      });
    return () => { clearTimeout(retry); supabase.removeChannel(ch); };
  }, [id, user?.id, qc, attempt]);
  useEffect(() => { if (owner && viewers > 0) supabase.rpc('record_live_viewers', { _live: id, _count: viewers }); }, [owner, viewers, id]);
  useEffect(() => { const on = () => setAttempt(a => a + 1); window.addEventListener('online', on); return () => window.removeEventListener('online', on); }, []);

  // Likes are batched and flushed every 3 s; the counter only shows the server value plus a visible "pending" bubble.
  useEffect(() => {
    if (!user) return;
    const t = setInterval(async () => {
      const n = Math.min(pendingRef.current, LIKE_BATCH_MAX); if (!n) return;
      pendingRef.current = 0; setPending(0);
      const r = await supabase.rpc('add_live_likes', { _live: id, _count: n });
      if (r.error) toast.error('Likes non synchronisés.');
      else qc.setQueryData(['live', id], (old: any) => old ? { ...old, like_count: r.data } : old);
    }, 1000);
    return () => clearInterval(t);
  }, [id, user?.id, qc]);

  useEffect(() => { const el = chatRef.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [messages.length, arrivals.length]);
  useEffect(() => { const c = live?.like_count; if (c == null) return; if (lastLikes.current != null && c > lastLikes.current + pending) popHearts(c - lastLikes.current); lastLikes.current = c; }, [live?.like_count]);

  if (live === null) return <main className="mx-auto max-w-md p-6 text-center"><p>Ce live n’existe pas.</p><Button asChild className="mt-4"><Link to="/lives">Voir les lives</Link></Button></main>;
  const ended = live?.status === 'ended';
  const chosenGift = gifts.find(g => g.id === chosen);

  const audio = live?.kind === 'audio';
  const guestIds = new Set(requests.filter(r => r.status === 'accepted').map(r => r.user_id));
  const guests = requests.filter(r => r.status === 'accepted');
  const visibleGuests = guests.filter(g => g.user_id !== user?.id);
  const share = async () => { try { if (navigator.share) await navigator.share({ title: live?.title ?? 'VINASOUND LIVE', url: window.location.href }); else { await navigator.clipboard.writeText(window.location.href); toast.success('Lien du live copié'); } } catch (e) { if ((e as Error)?.name === 'AbortError') return; try { await navigator.clipboard.writeText(window.location.href); toast.success('Lien du live copié'); } catch { window.prompt('Copie le lien du live :', window.location.href); } } };
  return <div className="live-theme live-room bg-background text-foreground"><ClipSidebar /><main className="live-room-main">
    <header className="live-topbar">
      <div className="live-creator-pill"><Link to="/createur/$id" params={{ id: live?.user_id ?? id }} aria-label="Profil de l’hôte" className="shrink-0"><Avatar path={live?.profiles?.avatar_path ?? null} name={live?.profiles?.username ?? '?'} className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-secondary text-secondary-foreground" /></Link><div className="min-w-0 flex-1 leading-tight"><h1 className="truncate text-xs font-semibold">{live?.profiles?.username ?? 'VINASOUND'}</h1><p className="text-[10px] opacity-80">♥ {(live?.like_count ?? 0) + pending}</p></div>{live && <FollowShare compact hostId={live.user_id} userId={user?.id} title={live.title} />}</div>
      <button type="button" className="live-faces" onClick={() => setPeopleOpen(true)} aria-label="Participants">{present.slice(0, 3).map(p => <span key={p.key} className="live-face">{p.name[0]?.toUpperCase()}</span>)}</button>
      <button type="button" className="live-viewers" onClick={() => setPeopleOpen(true)} aria-label="Spectateurs"><Eye className="size-3.5" />{viewers}</button>
      <Button variant="ghost" size="icon" className="live-close shrink-0" aria-label="Quitter le live" title="Quitter le live" onClick={async () => { if (owner && !ended) { await supabase.from('lives').update({ status: 'ended' }).eq('id', id); navigate({ to: '/lives' }); } }} asChild={!owner || ended}>{!owner || ended ? <Link to="/lives"><X /></Link> : <X />}</Button>
    </header>
    <div className="live-toolbar">
      <span className="live-badge"><span className="size-1.5 rounded-full bg-destructive" />{ended ? 'Terminé' : 'EN DIRECT'}</span>
      {live?.genre && <span className="live-badge">🎵 {live.genre}</span>}
      <span className="live-badge"><Trophy className="size-3 text-primary" />Classement hebdo</span>
      <button type="button" className="live-badge" onClick={() => setGuestOpen(true)}><Users className="size-3" />{guests.length}/{live?.guest_slots ?? 0}</button>
      <span className="flex-1" />
      <Link to="/lives" className="live-badge">💜 Explorer ›</Link>
      <button type="button" className="live-badge" aria-label="Plus d’options" onClick={() => setMoreOpen(true)}><MoreHorizontal className="size-3.5" /></button>
      {owner && <button type="button" className="live-badge" onClick={() => setStudioOpen(o => !o)}><Settings2 className="size-3" />Studio</button>}
    </div>
    {live?.title && !ended && <div className="live-banner">{live.title}</div>}
    <div className="live-hearts" aria-hidden>{hearts.map(h => <img key={h.key} src={loveImg} alt="" className="live-heart size-9 object-contain" style={{ ['--hx' as string]: `${h.x}px`, animationDelay: `${h.d}ms` }} />)}</div>
    <section className={`live-stage-layout ${visibleGuests.length && !ended ? 'has-guests' : ''}`} aria-label="Scène du live"><div className="live-host-tile video-surface relative overflow-hidden rounded-lg bg-muted">
        {audio && !ended && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted pb-14">
          <span className="flex size-24 items-center justify-center rounded-full bg-primary text-4xl font-bold text-primary-foreground">{live?.profiles?.username?.[0]?.toUpperCase() ?? '♪'}</span>
          <div aria-hidden className="flex h-10 items-end gap-1">{Array.from({ length: 16 }, (_, i) => <span key={i} className="audio-bar w-1.5 rounded-full bg-primary" style={{ animationDelay: `${(i % 5) * 0.12}s` }} />)}</div>
        </div>}
        {live?.stream_url && isStreamUrl(live.stream_url) && !ended
          ? <iframe src={live.stream_url} title={live.title} allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen className={audio ? 'absolute inset-x-0 bottom-0 h-14 w-full border-0 opacity-90' : 'absolute inset-0 size-full border-0'} />
          : live && !ended && !live.stream_url
            ? owner ? (hostStream && !audio ? <video ref={selfRef} autoPlay muted playsInline className="absolute inset-0 size-full -scale-x-100 object-cover" /> : <div className="flex size-full flex-col items-center justify-center gap-4 p-8 text-center text-sm text-muted-foreground"><Avatar path={live.profiles?.avatar_path ?? null} name={live.profiles?.username ?? '?'} className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-secondary text-3xl text-secondary-foreground" />{hostStream ? 'Tu es en direct 🎙' : 'Diffusion en attente'}{!hostStream && <Button variant="secondary" onClick={() => setStudioOpen(true)}><Settings2 />Ouvrir le studio</Button>}</div>) : <ViewerPlayer liveId={id} audioOnly={audio} />
            : ended && live ? <EndSummary live={live} gifts={received.reduce((s, g) => s + g.price, 0)} /> : <div className="flex size-full items-center justify-center p-6 text-center text-muted-foreground">Chargement…</div>}
        <div className="pointer-events-none absolute inset-x-0 top-[38%] z-20 flex flex-col items-start gap-2 pl-2">
          {bursts.map((b, i) => <div key={b.key} className="gift-banner" style={{ animationDelay: `${i * 60}ms` }}>
            <span className="min-w-0"><b className="block truncate text-xs">@{b.from}</b><span className="block truncate text-[11px] opacity-80">a envoyé {b.who}</span></span>
            {b.art ? <img src={b.art} alt="" className="gift-banner-art" /> : <span className="text-2xl">{b.emoji}</span>}
            <span className="gift-banner-count">x1</span>
          </div>)}
        </div>
        {bursts.slice(-1).map(b => b.art && <img key={`big-${b.key}`} src={b.art} alt="" aria-hidden className="gift-hero" />)}
        <div className="absolute left-2 top-2 flex gap-2 text-xs"><span className="rounded-full bg-primary px-2.5 py-1 font-semibold text-primary-foreground">♙ Hôte</span>
        </div>
        <span className="live-nameplate">@{live?.profiles?.username ?? 'artiste'}</span>
      </div>{!ended && <GuestTiles liveId={id} guests={guests} selfId={user?.id} audioOnly={audio} />}</section>
    <aside className="live-chat">
      <div className="live-chat-heading"><p className="flex items-center gap-2 font-semibold"><span className="size-2 rounded-full bg-destructive" />Chat en direct</p><span className={`text-xs ${conn === 'ok' ? 'text-muted-foreground' : 'text-destructive'}`}>{conn === 'ok' ? 'Connecté' : conn === 'erreur' ? 'Erreur, reconnexion…' : 'Connexion…'}</span></div>
      {owner && studioOpen && <div className="space-y-2 border-b p-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setPicked(messages.filter(m => !m.hidden).slice(-200).map(m => m.id))}>Tout sélectionner</Button>
          {picked.length > 0 && <Button size="sm" variant="ghost" onClick={() => setPicked([])}>Effacer ({picked.length})</Button>}
          <Button size="sm" disabled={!picked.length || analysing} onClick={async () => { setAnalysing(true); try { setInsight(await summarize({ data: { liveId: id, messageIds: picked } })); } catch (e) { toast.error(e instanceof Error ? e.message : 'Analyse impossible.'); } finally { setAnalysing(false); } }}><Sparkles />{analysing ? 'Analyse…' : 'Résumer les questions'}</Button>
        </div>
        {insight && <div className="space-y-2 rounded-md bg-muted p-2">
          {insight.urgent.length > 0 && <ul className="space-y-1">{insight.urgent.map((u, i) => <li key={i} className="flex gap-1 text-destructive"><AlertTriangle className="size-4 shrink-0" /><span><strong>{u.topic}</strong> — {u.reason}</span></li>)}</ul>}
          <p>{insight.summary}</p>
          {insight.questions.length > 0 && <ul className="list-disc pl-5">{insight.questions.map((q, i) => <li key={i}>{q}</li>)}</ul>}
          <Button size="sm" variant="ghost" onClick={() => setInsight(null)}>Fermer</Button>
        </div>}
      </div>}
      <div ref={chatRef} onScroll={e => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }} className="live-chat-messages">
        {[...messages.map(m => ({ t: 'm' as const, at: m.created_at, m })), ...received.slice(0, 30).map(g => ({ t: 'g' as const, at: g.created_at, g })), ...arrivals.map(a => ({ t: 'j' as const, at: a.at, a })), ...likers.map(a => ({ t: 'l' as const, at: a.at, a }))].sort((a, b) => a.at.localeCompare(b.at)).map(e => e.t === 'l' ? <p key={`l-${e.a.key}`} className="live-join-note">❤️ <b>{e.a.name}</b> a aimé ×{e.a.n}</p> : e.t === 'j' ? <p key={`j-${e.a.key}-${e.a.at}`} className="live-join-note">👋 <b>{e.a.name}</b> a rejoint</p> : e.t === 'g'
          ? <p key={`g-${e.g.id}`} className="rounded-xl bg-primary/10 px-3 py-1.5 text-center text-xs">{giftArt(e.g.gift_id) ? <img src={giftArt(e.g.gift_id)} alt="" className="inline size-6 object-contain align-middle" /> : <span className="text-base">{e.g.gifts?.emoji}</span>} <b>@{e.g.profiles?.username}</b> a offert {e.g.gifts?.name}</p>
          : (m => <div key={m.id} className={`flex gap-2 rounded-xl ${m.hidden ? 'opacity-50' : ''} ${guestIds.has(m.user_id) || m.user_id === live?.user_id ? 'bg-accent/40 p-1' : ''}`}>
          {owner && studioOpen && <input type="checkbox" aria-label="Sélectionner pour l’analyse" className="mt-2 accent-primary" checked={picked.includes(m.id)} onChange={e => setPicked(p => e.target.checked ? [...p, m.id].slice(-200) : p.filter(x => x !== m.id))} />}
          <Avatar path={m.profiles?.avatar_path ?? null} name={m.profiles?.username ?? '?'} className="live-message-avatar flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs text-secondary-foreground" />
          <div className="min-w-0 flex-1 text-sm"><span className="font-normal text-muted-foreground">@{m.profiles?.username}</span>{m.user_id === live?.user_id ? <span className="ml-1 rounded bg-primary px-1 text-[10px] text-primary-foreground">HÔTE</span> : guestIds.has(m.user_id) && <span className="ml-1 rounded bg-secondary px-1 text-[10px]">INVITÉ</span>} <span className="hidden text-[10px] text-muted-foreground lg:inline">{new Date(m.created_at).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })}</span><p className="break-words">{m.body}</p></div>
          {owner && m.user_id !== user?.id && <div className="flex">
            <Button variant="ghost" size="icon" className="size-7" aria-label="Masquer" disabled={m.hidden} onClick={async () => { await supabase.from('live_messages').update({ hidden: true }).eq('id', m.id); qc.invalidateQueries({ queryKey: ['live-messages', id] }); }}><EyeOff className="size-3" /></Button>
            <Button variant="ghost" size="icon" className="size-7" aria-label="Bloquer du live" onClick={async () => { const r = await supabase.from('live_bans').insert({ live_id: id, user_id: m.user_id }); toast[r.error ? 'error' : 'success'](r.error ? 'Déjà bloqué.' : 'Spectateur bloqué.'); }}><Ban className="size-3" /></Button>
          </div>}
          {user && !owner && m.user_id !== user.id && <Button variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Signaler" onClick={async () => { const r = await supabase.from('live_reports').insert({ live_id: id, message_id: m.id, reporter_id: user.id }); toast[r.error ? 'error' : 'success'](r.error ? 'Déjà signalé.' : 'Message signalé à l’hôte.'); }}><Flag className="size-3" /></Button>}
        </div>)(e.m))}
        {messages.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Sois le premier à écrire.</p>}
      </div>
      <div className="live-controls"><form className="live-input-wrap" onSubmit={async e => {
          e.preventDefault(); const body = text.trim(); if (!body || !user || ended || !live?.comments_enabled) return;
          const r = await supabase.from('live_messages').insert({ live_id: id, user_id: user.id, body });
          if (r.error) toast.error(/Mode lent/.test(r.error.message) ? `Mode lent : un message toutes les ${live?.slow_mode_seconds} s.` : /Liens/.test(r.error.message) ? 'Les liens sont interdits sur ce live.' : /rapide|Trop/.test(r.error.message) ? 'Doucement, attends un peu.' : /répété/.test(r.error.message) ? 'Message déjà envoyé.' : 'Message non envoyé.');
          else { setText(''); stick.current = true; qc.invalidateQueries({ queryKey: ['live-messages', id] }); }
        }}>
          <input maxLength={300} value={text} onChange={e => setText(e.target.value)} disabled={!user || ended || !live?.comments_enabled} aria-label="Message du chat" placeholder={ended ? 'Live terminé' : !user ? 'Compte non relié' : !live?.comments_enabled ? 'Chat désactivé' : 'Ajouter un commentaire…'} />
          <Button variant="ghost" size="icon" type={text.trim() ? 'submit' : 'button'} disabled={!user || ended || !live?.comments_enabled} aria-label={text.trim() ? 'Envoyer' : 'Ajouter un emoji'} onClick={() => { if (!text.trim()) setText('😊'); }}>{text.trim() ? <Send /> : <Smile />}</Button>
        </form>
        <Button className="live-action text-destructive" variant="secondary" size="icon" aria-label="Aimer le live" title="Aimer le live" disabled={ended} onClick={() => { popHearts(1); if (!user) return; if (pendingRef.current >= LIKE_BATCH_MAX) return; pendingRef.current += 1; setPending(pendingRef.current); addLiker(user.id, meName.current, 1); chRef.current?.send({ type: 'broadcast', event: 'like', payload: { key: user.id, name: meName.current, n: 1 } }); }}><img src={loveImg} alt="" className="size-6 object-contain" /></Button>
        <Button className="live-action" variant="secondary" size="icon" aria-label="Participants" title="Participants" onClick={() => setPeopleOpen(true)}><Users /></Button>
        <Button className="live-action" variant="secondary" size="icon" aria-label="Cadeaux" title="Cadeaux" disabled={ended} onClick={() => setGiftOpen(true)}><img src={giftArt('treasure')} alt="" className="size-6 object-contain" /></Button>
        <Button className="live-action" variant="secondary" size="icon" aria-label="Partager" title="Partager" onClick={() => setShareOpen(true)}><Share2 /></Button>
      </div>
    </aside>
      {owner && <div className={`live-studio-panel ${studioOpen ? "is-open" : ""}`}><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Studio live</h2><Button variant="ghost" size="icon" aria-label="Fermer le studio" onClick={() => setStudioOpen(false)}><X /></Button></div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary">Studio live</p><p className="mb-3 text-base font-bold">Espace artiste</p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button variant="outline" className="rounded-full" disabled={ended} onClick={async () => { const r = await supabase.from('lives').update({ comments_enabled: !live?.comments_enabled }).eq('id', id); if (r.error) toast.error('Action impossible.'); else qc.invalidateQueries({ queryKey: ['live', id] }); }}><MessageSquareOff />{live?.comments_enabled ? 'Couper le chat' : 'Rouvrir le chat'}</Button>
          {confirmEnd ? <span className="col-span-2 flex flex-wrap items-center gap-2 rounded-xl border border-destructive/50 p-2"><span className="text-xs">Terminer définitivement ce live ?</span><Button variant="destructive" size="sm" className="rounded-full" onClick={async () => { const r = await supabase.from('lives').update({ status: 'ended' }).eq('id', id); setConfirmEnd(false); if (r.error) toast.error('Action impossible.'); else qc.invalidateQueries({ queryKey: ['live', id] }); }}>Oui, terminer</Button><Button variant="ghost" size="sm" onClick={() => setConfirmEnd(false)}>Annuler</Button></span>
          : <Button variant="destructive" className="rounded-full" disabled={ended} onClick={() => setConfirmEnd(true)}><Square />Terminer le live</Button>}
        </div>
        {live && !ended && <div className="mt-4 grid gap-4 rounded-xl bg-background/60 p-3 sm:grid-cols-2"><HostRequests live={live} requests={requests} /><ModerationTools live={live} /></div>}
        <div className="mt-3"><AudioDoctor /></div>
        {!ended && !live?.stream_url && <div className="mt-3"><BroadcasterPanel liveId={id} audioOnly={audio} autoStart onStream={setHostStream} /></div>}
        {keys && !ended && <div className="mt-3 space-y-1 rounded-xl bg-muted p-3 text-xs"><p className="font-semibold">Diffuse depuis OBS ou ton application (garde la clé secrète)</p><p className="break-all">Serveur : <code>{keys.rtmps_url}</code></p><p className="break-all">Clé : <code>{keys.stream_key}</code></p><Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(keys.stream_key).then(() => toast.success('Clé copiée'))}>Copier la clé</Button></div>}
        <p className="mt-3 font-semibold">Cadeaux reçus ({received.reduce((s, g) => s + g.price, 0)} crédits)</p>
        <ul className="max-h-32 overflow-y-auto">{received.map(g => <li key={g.id} className="flex items-center gap-1">{giftArt(g.gift_id) ? <img src={giftArt(g.gift_id)} alt="" className="size-5" /> : g.gifts?.emoji} @{g.profiles?.username} · {g.gifts?.name}</li>)}{received.length === 0 && <li className="text-muted-foreground">Aucun pour l’instant.</li>}</ul>
      </div>}
      <LiveSheet open={giftOpen} onOpenChange={setGiftOpen} title="Cadeaux"><div>
        {!user && <p className="mb-2 rounded-lg bg-muted p-2 text-xs">Ton compte VINASOUND doit être relié pour envoyer un cadeau.</p>}
        {!live?.gifts_enabled && <p className="mb-2 rounded-lg bg-muted p-2 text-xs">Les cadeaux sont désactivés pour ce live.</p>}
        {owner && <p className="mb-2 rounded-lg bg-muted p-2 text-xs">Tu es l’hôte : tes spectateurs t’envoient ces cadeaux. Tu peux les voir ici, mais pas te les offrir.</p>}
        <p className="mb-2 text-sm">{freeMode ? <><strong>Mode test : cadeaux gratuits</strong> <span className="text-muted-foreground">· prix affichés en crédits pour plus tard</span></> : <>Solde : <strong>{balance ?? '…'}</strong> crédits</>}</p>
        <div className="grid grid-cols-4 gap-1">{gifts.map(g => { const art = giftArt(g.id); const sel = chosen === g.id; return <button key={g.id} type="button" onClick={() => { setChosen(g.id); refRef.current = crypto.randomUUID(); }} className={`gift-cell ${sel ? 'gift-cell-on' : ''}`}>
          {art ? <img src={art} alt="" width={64} height={64} loading="lazy" className="size-14 object-contain" /> : <span className="text-4xl">{g.emoji}</span>}
          <span className="w-full truncate text-xs">{g.name}</span><span className="flex items-center gap-1 text-xs font-semibold"><span className="gift-coin" />{g.price}</span>
        </button>; })}{gifts.length === 0 && <p className="col-span-4 text-sm text-muted-foreground">Aucun cadeau disponible.</p>}</div>
        {chosenGift && <Button className="mt-3 h-11 w-full rounded-lg" variant="destructive" disabled={sending || owner || !live?.gifts_enabled} onClick={async () => {
          setSending(true);
          if (!user) { try { const v = await supabase.auth.signInAnonymously(); if (v.error) throw v.error; } catch { setSending(false); toast.error('Envoi impossible pour le moment.'); return; } }
          const r = await supabase.rpc('send_live_gift', { _live: id, _gift: chosenGift.id, _reference: refRef.current });
          setSending(false);
          if (r.error) toast.error(r.error.message.includes('Solde') ? 'Solde insuffisant.' : 'Le cadeau n’a pas été envoyé.');
          else { toast.success(`${chosenGift.name} envoyé !`); qc.invalidateQueries({ queryKey: ['wallet'] }); setChosen(null); refRef.current = crypto.randomUUID(); }
        }}>{owner ? 'Tu es l’hôte : seuls les spectateurs peuvent offrir' : sending ? 'Envoi…' : freeMode ? `Envoyer ${chosenGift.name} · gratuit` : `Envoyer ${chosenGift.name} · ${chosenGift.price} crédits`}</Button>}
      </div></LiveSheet>
    <LiveSheet open={guestOpen} onOpenChange={setGuestOpen} title="Invités du live">{live && owner ? <HostRequests live={live} requests={requests} /> : live && user && !ended ? <ViewerStage live={live} userId={user.id} requests={requests} audioOnly={audio} /> : <p className="text-sm text-muted-foreground">{ended ? 'Ce live est terminé.' : 'Ton compte VINASOUND doit être relié pour monter sur scène.'}</p>}<ul className="space-y-2">{guests.map(g => <li key={g.id} className="flex items-center gap-2"><Users className="size-4" />@{g.profiles?.username}</li>)}</ul></LiveSheet>
    <LiveSheet open={peopleOpen} onOpenChange={setPeopleOpen} title={`Participants (${viewers})`}><Button variant="outline" onClick={() => { setPeopleOpen(false); setGuestOpen(true); }}><Users />Invités sur scène ({guests.length}/{live?.guest_slots ?? 0})</Button><ul className="space-y-2">{present.map(p => <li key={p.key} className="flex items-center gap-2 text-sm"><span className="live-face">{p.name[0]?.toUpperCase()}</span>{p.name}{p.key === live?.user_id && <span className="rounded bg-primary px-1 text-[10px] text-primary-foreground">HÔTE</span>}{guestIds.has(p.key) && <span className="rounded bg-secondary px-1 text-[10px]">INVITÉ</span>}</li>)}</ul></LiveSheet>
    <LiveSheet open={shareOpen} onOpenChange={setShareOpen} title="Partager le live"><ShareTargets title={live?.title ?? 'VINASOUND LIVE'} onNative={share} /></LiveSheet>
    <LiveSheet open={moreOpen} onOpenChange={setMoreOpen} title="Options du live"><Button variant="outline" onClick={share}><Share2 />Partager le live</Button>{owner && <Button variant="outline" onClick={() => { setStudioOpen(true); setMoreOpen(false); }}><Settings2 />Studio et modération</Button>}</LiveSheet>
  </main></div>;
}
