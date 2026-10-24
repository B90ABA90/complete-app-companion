import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, Maximize, Volume2 } from 'lucide-react';

// Peer-to-peer WebRTC broadcast; Cloud Realtime broadcast carries only signalling (offers, answers, ICE).
// ICE candidates can arrive before the remote description is applied; queue them until it is.
function addIce(pc: RTCPeerConnection, q: RTCIceCandidateInit[], c: RTCIceCandidateInit) { if (pc.remoteDescription) pc.addIceCandidate(c).catch(() => {}); else q.push(c); }
async function setRemote(pc: RTCPeerConnection, q: RTCIceCandidateInit[], d: RTCSessionDescriptionInit) { await pc.setRemoteDescription(d); for (const c of q.splice(0)) await pc.addIceCandidate(c).catch(() => {}); }
// Voice chain: browser noise suppression/echo cancel + high-pass (wind rumble) + compressor (steady voice level).
const VOICE: MediaTrackConstraints = { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 48000 };
async function captureClean(audioOnly: boolean) {
  const raw = await navigator.mediaDevices.getUserMedia({ audio: VOICE, video: audioOnly ? false : { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 }, frameRate: { ideal: 30 } } });
  try {
    const ctx = new AudioContext({ sampleRate: 48000 }); const src = ctx.createMediaStreamSource(raw);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 120; hp.Q.value = 0.7;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -28; comp.knee.value = 20; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
    const gain = ctx.createGain(); gain.gain.value = 1.4; const out = ctx.createMediaStreamDestination();
    src.connect(hp).connect(lp).connect(comp).connect(gain).connect(out);
    const clean = new MediaStream([...out.stream.getAudioTracks(), ...raw.getVideoTracks()]);
    const stopAll = () => { raw.getTracks().forEach(t => t.stop()); ctx.close().catch(() => {}); };
    clean.getAudioTracks()[0]?.addEventListener('ended', stopAll);
    (clean as MediaStream & { _stop?: () => void })._stop = stopAll;
    return clean;
  } catch { return raw; }
}
const stopStream = (s: MediaStream) => { s.getTracks().forEach(t => t.stop()); (s as MediaStream & { _stop?: () => void })._stop?.(); };
// Opus tuned for voice/music: higher bitrate + in-band FEC so packet loss doesn't cut words.
const tuneOpus = (sdp?: string) => sdp?.replace(/a=fmtp:(\d+) (.*useinbandfec=1.*)/, (_m, pt, p) => `a=fmtp:${pt} ${p};maxaveragebitrate=96000;stereo=0;usedtx=0`);
const ICE = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
const chan = (liveId: string, pub: string) => pub === 'artist' ? `rtc-${liveId}` : `rtc-${liveId}-${pub}`;
type Sig = { to?: string; from: string; kind: 'join' | 'offer' | 'answer' | 'ice' | 'bye'; sdp?: RTCSessionDescriptionInit; ice?: RTCIceCandidateInit };

export function BroadcasterPanel({ liveId, audioOnly, publisher = 'artist', label = 'Diffuser depuis ce navigateur', onStop, onStream, autoStart = false }: { liveId: string; audioOnly: boolean; publisher?: string; label?: string; onStop?: () => void; onStream?: (s: MediaStream | null) => void; autoStart?: boolean }) {
  const [stream, setStream] = useState<MediaStream | null>(null); const [err, setErr] = useState(''); const [peers, setPeers] = useState(0);
  const [mic, setMic] = useState(true); const [cam, setCam] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (videoRef.current) videoRef.current.srcObject = stream; onStream?.(stream); }, [stream]);
  // Start automatically when permission was already granted (e.g. in the creation preview).
  useEffect(() => { if (autoStart) start(); }, []);
  useEffect(() => {
    if (!stream) return;
    const me = 'artist'; const pcs = new Map<string, RTCPeerConnection>(); const queues = new Map<string, RTCIceCandidateInit[]>();
    const ch = supabase.channel(chan(liveId, publisher), { config: { broadcast: { self: false } } });
    const send = (m: Sig) => ch.send({ type: 'broadcast', event: 'sig', payload: m });
    const connect = async (viewer: string) => {
      pcs.get(viewer)?.close();
      const pc = new RTCPeerConnection({ iceServers: ICE }); pcs.set(viewer, pc); queues.set(viewer, []);
      stream.getTracks().forEach(t => { const snd = pc.addTrack(t, stream); if (t.kind === 'audio') { const prm = snd.getParameters(); prm.encodings = [{ ...(prm.encodings?.[0] ?? {}), maxBitrate: 96000, priority: 'high', networkPriority: 'high' }]; snd.setParameters(prm).catch(() => {}); } });
      pc.onicecandidate = e => { if (e.candidate) send({ to: viewer, from: me, kind: 'ice', ice: e.candidate.toJSON() }); };
      pc.onconnectionstatechange = () => { if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) pcs.delete(viewer); setPeers([...pcs.values()].filter(p => p.connectionState === 'connected').length); };
      const o = await pc.createOffer(); const offer: RTCSessionDescriptionInit = { type: o.type, sdp: tuneOpus(o.sdp) ?? o.sdp ?? "" }; await pc.setLocalDescription(offer);
      send({ to: viewer, from: me, kind: 'offer', sdp: offer });
    };
    ch.on('broadcast', { event: 'sig' }, async ({ payload }) => {
      const m = payload as Sig;
      if (m.kind === 'join') return connect(m.from);
      if (m.to !== me) return;
      const pc = pcs.get(m.from); if (!pc) return;
      const q = queues.get(m.from) ?? [];
      if (m.kind === 'answer' && m.sdp) await setRemote(pc, q, m.sdp);
      if (m.kind === 'ice' && m.ice) addIce(pc, q, m.ice);
      if (m.kind === 'bye') { pc.close(); pcs.delete(m.from); }
    }).subscribe(s => { if (s === 'SUBSCRIBED') send({ from: me, kind: 'bye' }); });
    // Viewers already waiting re-send "join" when they see the artist "hello".
    const hello = setTimeout(() => ch.send({ type: 'broadcast', event: 'hello', payload: {} }), 800);
    return () => { clearTimeout(hello); pcs.forEach(p => p.close()); supabase.removeChannel(ch); };
  }, [stream, liveId, publisher]);
  useEffect(() => () => { if (stream) stopStream(stream); }, [stream]);
  const start = async () => {
    setErr('');
    try { setStream(await captureClean(audioOnly)); }
    catch { setErr(audioOnly ? 'Micro refusé : autorise-le dans les réglages du navigateur (icône cadenas), puis réessaie.' : 'Caméra ou micro refusé : autorise-les dans les réglages du navigateur (icône cadenas), puis réessaie.'); }
  };
  if (!stream) return <div className="space-y-2 rounded bg-muted p-3"><p className="font-semibold">{label}</p><p className="text-xs text-muted-foreground">Ta {audioOnly ? 'voix' : 'caméra et ta voix'} sont envoyées directement aux spectateurs.</p><Button size="sm" onClick={start}>{audioOnly ? <Mic /> : <Video />} Lancer la diffusion</Button>{err && <p className="text-xs text-destructive">{err}</p>}</div>;
  return <div className="space-y-2 rounded bg-muted p-3">
    <p className="flex items-center gap-2 font-semibold"><span className="size-2 animate-pulse rounded-full bg-destructive" /> Tu diffuses · {peers} spectateur{peers > 1 ? 's' : ''} connecté{peers > 1 ? 's' : ''} au flux</p>
    {!audioOnly && <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-48 rounded bg-background object-cover" />}
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => { stream.getAudioTracks().forEach(t => (t.enabled = !mic)); setMic(!mic); }}>{mic ? <Mic /> : <MicOff />}{mic ? 'Micro' : 'Micro coupé'}</Button>
      {!audioOnly && <Button size="sm" variant="outline" onClick={() => { stream.getVideoTracks().forEach(t => (t.enabled = !cam)); setCam(!cam); }}>{cam ? <Video /> : <VideoOff />}{cam ? 'Caméra' : 'Caméra coupée'}</Button>}
      <Button size="sm" variant="ghost" onClick={() => { stopStream(stream); setStream(null); onStop?.(); }}>Arrêter</Button>
    </div>
  </div>;
}

export function ViewerPlayer({ liveId, audioOnly, publisher = 'artist', waiting = 'En attente de la diffusion de l’artiste…', preview = false }: { liveId: string; audioOnly: boolean; publisher?: string; waiting?: string; preview?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null); const [state, setState] = useState<'attente' | 'ok' | 'coupé'>('attente'); const [muted, setMuted] = useState(true);
  useEffect(() => {
    const me = crypto.randomUUID(); let pc: RTCPeerConnection | null = null; let q: RTCIceCandidateInit[] = [];
    let ok = false;
    const ch = supabase.channel(chan(liveId, publisher), { config: { broadcast: { self: false } } });
    const send = (m: Sig) => ch.send({ type: 'broadcast', event: 'sig', payload: m });
    // Robustness: keep asking to join until media flows (covers lost signalling and broadcaster restarts).
    const retry = setInterval(() => { if (!ok) send({ from: me, kind: 'join' }); }, 4000);
    ch.on('broadcast', { event: 'hello' }, () => send({ from: me, kind: 'join' }))
      .on('broadcast', { event: 'sig' }, async ({ payload }) => {
        const m = payload as Sig;
        if (m.kind === 'bye' && m.from === 'artist' && !m.to) { ok = false; setState('attente'); return; }
        if (m.to !== me) return;
        if (m.kind === 'offer' && m.sdp) {
          pc?.close(); pc = new RTCPeerConnection({ iceServers: ICE }); q = []; const cur = pc;
          pc.ontrack = e => { if (ref.current) ref.current.srcObject = e.streams[0] ?? null; ok = true; setState('ok'); };
          pc.onicecandidate = e => { if (e.candidate) send({ to: 'artist', from: me, kind: 'ice', ice: e.candidate.toJSON() }); };
          pc.onconnectionstatechange = () => { if (pc && ['failed', 'disconnected'].includes(pc.connectionState)) { ok = false; setState('coupé'); } };
          await setRemote(cur, q, m.sdp); const a = await cur.createAnswer(); await cur.setLocalDescription(a);
          send({ to: 'artist', from: me, kind: 'answer', sdp: a });
        }
        if (m.kind === 'ice' && m.ice && pc) addIce(pc, q, m.ice);
      })
      .subscribe(s => { if (s === 'SUBSCRIBED') send({ from: me, kind: 'join' }); });
    return () => { clearInterval(retry); send({ to: 'artist', from: me, kind: 'bye' }); pc?.close(); supabase.removeChannel(ch); };
  }, [liveId, publisher]);
  return <>
    <video ref={ref} autoPlay playsInline muted={muted} className={audioOnly ? 'hidden' : `absolute inset-0 size-full ${preview ? 'object-cover' : 'bg-background object-contain'}`} />
    {state !== 'ok' && !audioOnly && !preview && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-muted-foreground">{state === 'coupé' ? 'Connexion perdue, reconnexion…' : waiting}</div>}
    {state === 'ok' && !preview && <div className="absolute bottom-2 right-2 z-10 flex gap-2">
      <Button size="sm" variant="secondary" onClick={() => setMuted(!muted)}><Volume2 />{muted ? 'Activer le son' : 'Couper le son'}</Button>
      {!audioOnly && <Button size="icon" variant="secondary" aria-label="Plein écran" onClick={() => ref.current?.requestFullscreen?.()}><Maximize /></Button>}
    </div>}
  </>;
}
