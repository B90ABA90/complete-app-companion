// Synthesised "glass breaking" + sparkle sound played when a gift lands (no audio file needed; swap for a sample later).
let ctx: AudioContext | null = null;
export function playGiftSound(big = false) {
  try {
    ctx ??= new AudioContext();
    const c = ctx; if (c.state === 'suspended') c.resume();
    const t = c.currentTime; const out = c.createGain(); out.gain.value = 0.5; out.connect(c.destination);
    // Crash: short burst of filtered noise.
    const len = c.sampleRate * 0.5; const buf = c.createBuffer(1, len, c.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const n = c.createBufferSource(); n.buffer = buf; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    const ng = c.createGain(); ng.gain.setValueAtTime(0.9, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    n.connect(hp).connect(ng).connect(out); n.start(t);
    // Shards: random high pings.
    const shards = big ? 14 : 8;
    for (let i = 0; i < shards; i++) {
      const o = c.createOscillator(); const g = c.createGain(); const st = t + 0.02 + Math.random() * 0.45;
      o.type = 'sine'; o.frequency.value = 2500 + Math.random() * 4500;
      g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(0.25, st + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, st + 0.18);
      o.connect(g).connect(out); o.start(st); o.stop(st + 0.2);
    }
  } catch { /* son indisponible */ }
}
