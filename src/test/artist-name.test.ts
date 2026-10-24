import { describe, expect, it } from 'vitest';
import { creatorName, type Profile } from '@/videos/lib/clip.types';

const profile: Profile = { id: 'artist-id', username: 'user_90a7131902', display_name: 'ABOULE9', bio: '', avatar_path: null };

describe('Video artist identity', () => {
  it('automatically uses the account artist name instead of the generated username', () => {
    expect(creatorName({ user_id: profile.id, profiles: profile, creator_name: 'Ancien nom' })).toBe('ABOULE9');
  });
  it('does not expose the generated visitor ID as an artist name', () => {
    expect(creatorName({ user_id: profile.id, profiles: { ...profile, display_name: '' }, creator_name: 'user_90a7131902' })).toBe('Artiste');
  });
  it('preserves an existing artist name when no linked display name is available', () => {
    expect(creatorName({ user_id: null, profiles: null, creator_name: 'ABOULE9' })).toBe('ABOULE9');
  });
});