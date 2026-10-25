import { describe, expect, it } from 'vitest';
import { parseVideoSearch, videoShareUrl } from '@/videos/lib/clip-share';

const ID = '3f2b8c1e-1d2a-4b5c-9e8f-0a1b2c3d4e5f';

describe('VINASOUND video sharing', () => {
  it('shares a link that opens the video in the home page modal', () => {
    expect(videoShareUrl('https://vinasound.example', ID)).toBe(`https://vinasound.example/?v=${ID}`);
  });
  it('opens the modal only for a valid video id', () => {
    expect(parseVideoSearch({ v: ID })).toEqual({ v: ID });
    expect(parseVideoSearch({ v: 'not-a-video' })).toEqual({});
    expect(parseVideoSearch({})).toEqual({});
  });
});
