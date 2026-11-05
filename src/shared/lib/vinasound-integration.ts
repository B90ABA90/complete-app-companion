// Complete these public settings when connecting the audio site. Never put secrets here.
export const vinasoundIntegration: VinasoundIntegration = {
  profileUrlTemplate: 'https://vinasound.fun/{artist}',
  // Video/Cloud profile UUID -> exact main-site handle, e.g. '...': 'ABOULE9'.
  artistHandles: {},
  // Enable only after the main site supplies the exact artist handle as username.
  useProfileUsername: false,
  // Subscriptions are completed on the existing main-site artist profile.
  // The main site must verify its own session and confirm the subscription there.
  followUrlTemplate: 'https://vinasound.fun/{artist}',
  // Main account page; leave empty until its real URL is known.
  accountUrl: '',
};

export type VinasoundIntegration = {
  profileUrlTemplate: string;
  artistHandles: Record<string, string>;
  useProfileUsername: boolean;
  followUrlTemplate: string;
  accountUrl: string;
};
export function safeMainSiteUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.origin !== 'https://vinasound.fun' || url.username || url.password) return undefined;
    return url.href;
  } catch { return undefined; }
}
export function artistDestination(id: string | null, username?: string | null, action: 'profile' | 'follow' = 'profile', config = vinasoundIntegration): string | undefined {
  const artist = (id ? config.artistHandles[id] : undefined) || (config.useProfileUsername ? username : undefined);
  if (!artist || !/^[a-zA-Z0-9_.-]+$/.test(artist) || artist === '.' || artist === '..') return undefined;
  const template = action === 'profile' ? config.profileUrlTemplate : config.followUrlTemplate;
  if (!template.includes('{artist}')) return undefined;
  return safeMainSiteUrl(template.replaceAll('{artist}', encodeURIComponent(artist)));
}