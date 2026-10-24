import { describe, expect, it } from 'vitest';
import { MAX_VIDEO_BYTES, MAX_AVATAR_BYTES, videoFormat, imageFormat } from '@/videos/lib/clip-upload';
describe('Video upload validation', () => {
  it('caps video bytes at 50 MiB', () => expect(MAX_VIDEO_BYTES).toBe(52428800));
  it('rejects arbitrary bytes renamed to mp4', () => expect(videoFormat(new TextEncoder().encode('<html>not a video</html>'))).toBeNull());
  it('recognizes MP4 file signatures', () => expect(videoFormat(new Uint8Array([0,0,0,24,102,116,121,112,105,115,111,109,0,0,0,0]))).toBe('mp4'));
  it('recognizes WebM file signatures', () => expect(videoFormat(new Uint8Array([0x1a,0x45,0xdf,0xa3,1,2,3]))).toBe('webm'));
});
describe('Avatar upload validation', () => {
  it('caps avatar bytes at 5 MiB', () => expect(MAX_AVATAR_BYTES).toBe(5242880));
  it('recognizes JPEG signatures', () => expect(imageFormat(new Uint8Array([0xff,0xd8,0xff,0xe0,1,2,3,4]))).toBe('jpeg'));
  it('recognizes PNG signatures', () => expect(imageFormat(new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x4a,0x52]))).toBe('png'));
  it('recognizes WebP signatures', () => expect(imageFormat(new Uint8Array([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50,1,2]))).toBe('webp'));
  it('rejects arbitrary bytes renamed to png', () => expect(imageFormat(new TextEncoder().encode('<html>not an image</html>'))).toBeNull());
});
