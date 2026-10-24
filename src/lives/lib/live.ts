export function isStreamUrl(value: string) {
  try {
    const u = new URL(value.trim());
    return u.protocol === 'https:' && (/^customer-[a-z0-9]+\.cloudflarestream\.com$/.test(u.hostname) || u.hostname === 'iframe.videodelivery.net');
  } catch { return false; }
}
export const LIKE_BATCH_MAX = 15;

export const GUEST_SLOTS = [1, 3, 5, 8] as const;
export type LiveSettings = { visibility: 'public' | 'followers' | 'private'; join_policy: 'everyone' | 'followers' | 'nobody'; guest_slots: 1 | 3 | 5 | 8; comments_enabled: boolean; gifts_enabled: boolean; strict_spam: boolean };
export const DEFAULT_SETTINGS: LiveSettings = { visibility: 'public', join_policy: 'everyone', guest_slots: 3, comments_enabled: true, gifts_enabled: true, strict_spam: true };
/** Mirrors the server rule: a request is possible only when the live accepts it and a guest place remains. */
export function canRequestStage(policy: LiveSettings['join_policy'], isFollower: boolean) { return policy === 'everyone' || (policy === 'followers' && isFollower); }
export function hasFreeSlot(slots: number, accepted: number) { return accepted < slots; }
/** Seconds the viewer must still wait in slow mode (0 = can send). */
export function slowModeWait(slowSeconds: number, lastSentMs: number | null, nowMs: number) { if (!slowSeconds || lastSentMs == null) return 0; return Math.max(0, Math.ceil((lastSentMs + slowSeconds * 1000 - nowMs) / 1000)); }
export function formatDuration(ms: number) { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h} h ${m} min` : `${m} min ${s % 60} s`; }
