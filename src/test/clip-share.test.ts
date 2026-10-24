import { describe, expect, it } from 'vitest';
import { videoShareUrl } from '@/videos/lib/clip-share';

describe('VINASOUND video sharing', () => {
  it('shares the VINASOUND video page', () => {
    expect(videoShareUrl('https://vinasound.example', 'video-123')).toBe('https://vinasound.example/video/video-123');
  });
});