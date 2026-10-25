import { describe, expect, it } from 'vitest';
import { canDeleteVideo } from '@/videos/lib/clip.types';

describe('video deletion rights', () => {
  it('lets the owner delete their published video', () => {
    expect(canDeleteVideo('u1', { user_id: 'u1', is_example: false })).toBe(true);
  });
  it('refuses another account', () => {
    expect(canDeleteVideo('u2', { user_id: 'u1', is_example: false })).toBe(false);
  });
  it('refuses signed-out visitors', () => {
    expect(canDeleteVideo(undefined, { user_id: 'u1', is_example: false })).toBe(false);
  });
});
