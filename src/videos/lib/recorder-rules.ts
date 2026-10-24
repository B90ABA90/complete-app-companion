// Rules for the full-screen hold-to-record camera.
export const DURATIONS = [
  { label: '15 s', seconds: 15 },
  { label: '60 s', seconds: 60 },
  { label: '3 min', seconds: 180 },
] as const;

export const ZOOMS = [1, 2, 3] as const;

export const FILTERS = [
  { label: 'Normal', css: 'none' },
  { label: 'Lumineux', css: 'brightness(1.15) saturate(1.1)' },
  { label: 'Chaud', css: 'sepia(0.25) saturate(1.3)' },
  { label: 'Noir et blanc', css: 'grayscale(1)' },
] as const;

export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
/** Takes shorter than this are discarded (a tap instead of a hold). */
export const MIN_TAKE_MS = 500;

/** A take stops at the chosen duration, or earlier when the added sound ends. */
export function recordLimitSeconds(chosen: number, audioSeconds?: number | null): number {
  if (audioSeconds && Number.isFinite(audioSeconds) && audioSeconds > 0) return Math.min(chosen, audioSeconds);
  return chosen;
}

/** Progress ring around the record button: full circle hidden at 0, fully drawn at the limit. */
export function ringOffset(elapsedMs: number, limitSeconds: number, circumference: number): number {
  const ratio = Math.min(1, Math.max(0, elapsedMs / (limitSeconds * 1000)));
  return circumference * (1 - ratio);
}
