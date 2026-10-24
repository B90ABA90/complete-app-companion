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

/** ~2s VINASOUND end signature: rising chime with a soft echo. */
export function playEndSignature() {
  try {
    if (!ctx) ctx = new AudioContext();
    const c = ctx; void c.resume();
    const t0 = c.currentTime + 0.02;
    const master = c.createGain(); master.gain.value = 0.35; master.connect(c.destination);
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      const t = t0 + i * 0.16;
      for (const [type, mult, vol] of [['sine', 1, 1], ['triangle', 2, 0.25]] as const) {
        const o = c.createOscillator(); const g = c.createGain();
        o.type = type; o.frequency.value = f * mult;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + (i === notes.length - 1 ? 1.4 : 0.5));
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.5);
      }
    });
  } catch { /* ignore */ }
}
