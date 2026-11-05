import { describe, expect, it } from 'vitest';
import { artistDestination, safeMainSiteUrl, vinasoundIntegration } from '@/shared/lib/vinasound-integration';

describe('Main VINASOUND accounts', () => {
  const config = { ...vinasoundIntegration, artistHandles: { 'video-user': 'ABOULE9' } };
  it('opens the existing artist profile rather than a video profile', () => {
    expect(artistDestination('video-user', 'guest', 'profile', config)).toBe('https://vinasound.fun/ABOULE9');
  });
  it('does not guess a main artist account from an anonymous video username', () => {
    expect(artistDestination('unlinked-user', 'ABOULE9')).toBeUndefined();
  });
  it('opens the main-site username profile for the subscription action', () => {
    expect(artistDestination('video-user', null, 'follow', config)).toBe('https://vinasound.fun/ABOULE9');
  });
  it('does not infer the subscription destination for an unlinked account', () => {
    expect(artistDestination('unlinked-user', 'ABOULE9', 'follow')).toBeUndefined();
  });
  it('routes a configured follow action to the main site', () => {
    expect(artistDestination('video-user', null, 'follow', { ...config, followUrlTemplate: 'https://vinasound.fun/{artist}?action=follow' })).toBe('https://vinasound.fun/ABOULE9?action=follow');
  });
  it('rejects unsafe destinations and traversal handles', () => {
    expect(safeMainSiteUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeMainSiteUrl('https://vinasound.fun.evil.test/ABOULE9')).toBeUndefined();
    expect(artistDestination('video-user', null, 'profile', { ...config, artistHandles: { 'video-user': '..' } })).toBeUndefined();
  });
});