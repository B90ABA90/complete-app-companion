import { describe, expect, it } from 'vitest';
import { exportFileName, needsMp4Conversion, pickExportMime } from '@/videos/lib/video-export';

describe('download with VINASOUND signature', () => {
  it('prefers MP4 when the browser can record it', () => {
    expect(pickExportMime(m => m.startsWith('video/mp4') || m.startsWith('video/webm'))).toMatch(/^video\/mp4/);
  });
  it('falls back to WebM only when MP4 is unavailable', () => {
    expect(pickExportMime(m => m.startsWith('video/webm'))).toMatch(/^video\/webm/);
  });
  it('converts any non-MP4 recording to MP4 before saving', () => {
    expect(needsMp4Conversion('video/webm;codecs=vp9,opus')).toBe(true);
    expect(needsMp4Conversion('video/mp4;codecs=avc1')).toBe(false);
  });
  it('names the file with the matching extension', () => {
    expect(exportFileName('1234567890ab', 'video/mp4;codecs=avc1')).toBe('vinasound-12345678.mp4');
    expect(exportFileName('1234567890ab', 'video/webm')).toBe('vinasound-12345678.webm');
  });
});
