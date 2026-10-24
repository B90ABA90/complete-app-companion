// Browsers block sound until the visitor interacts once; after that, all feed videos play with sound.
let unlocked = false;
let ctx: AudioContext | null = null;
const listeners = new Set<() => void>();

export const isSoundUnlocked = () => unlocked;
export const onSoundUnlock = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

export function unlockSound() {
  if (unlocked) return;
  unlocked = true;
  try { ctx = new AudioContext(); void ctx.resume(); } catch { /* ignore */ }
  listeners.forEach(l => l());
}

if (typeof window !== 'undefined') {
  const h = () => unlockSound();
  for (const ev of ['pointerdown', 'touchstart', 'keydown', 'wheel']) window.addEventListener(ev, h, { once: true, passive: true });
}

/** ~2s VINASOUND end signature: loud rising chime over a punchy, full bass (kick + sub + warm bass line). */
export function playEndSignature(target?: { ctx: AudioContext; out: AudioNode }) {
  try {
    if (!target && !ctx) ctx = new AudioContext();
    const c = target?.ctx ?? ctx!; void c.resume();
    const t0 = c.currentTime + 0.02;
    // Compressor + limiter-style settings keep the louder mix from clipping on phone speakers.
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 6; comp.ratio.value = 8; comp.attack.value = 0.003; comp.release.value = 0.2;
    const master = c.createGain(); master.gain.value = 1.6;
    const bassBoost = c.createBiquadFilter(); bassBoost.type = 'lowshelf'; bassBoost.frequency.value = 160; bassBoost.gain.value = 9;
    master.connect(bassBoost); bassBoost.connect(comp); comp.connect(target?.out ?? c.destination);

    // Kick: fast pitch drop gives the "boom" at the start and on the last note.
    const kick = (t: number, vol: number) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.35);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.65);
    };
    kick(t0, 1.1);

    // Bass line: sub sine + filtered saw (harmonics so small speakers still "hear" the bass).
    const bass = (f: number, t: number, dur: number) => {
      const sub = c.createOscillator(); const saw = c.createOscillator(); const lp = c.createBiquadFilter(); const g = c.createGain();
      sub.type = 'sine'; sub.frequency.value = f; saw.type = 'sawtooth'; saw.frequency.value = f;
      lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 4;
      const sg = c.createGain(); sg.gain.value = 0.35; saw.connect(sg); sg.connect(lp);
      sub.connect(lp); lp.connect(g); g.connect(master);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.75, t + 0.02); g.gain.setValueAtTime(0.75, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      for (const o of [sub, saw]) { o.start(t); o.stop(t + dur + 0.05); }
    };
    bass(65.41, t0, 0.5);          // C2
    bass(98.0, t0 + 0.32, 0.3);    // G2
    bass(65.41, t0 + 0.48, 1.5);   // C2 held under the final chime
    kick(t0 + 0.48, 1);

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      const t = t0 + i * 0.16;
      for (const [type, mult, vol] of [['sine', 1, 0.8], ['triangle', 2, 0.25], ['sine', 0.5, 0.35]] as const) {
        const o = c.createOscillator(); const g = c.createGain();
        o.type = type; o.frequency.value = f * mult;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + (i === notes.length - 1 ? 1.6 : 0.5));
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.7);
      }
    });
  } catch { /* ignore */ }
}
