import { describe, expect, it } from 'vitest';
import { deleteExpiredVideos, VIDEO_LIFETIME_MS, videoExpired, videoUrlLifetime } from '@/videos/lib/video-lifetime';

describe('24-hour video retention', () => {
  const published = Date.parse('2026-10-23T16:46:00Z');
  const deadline = '2026-10-24T16:46:00Z';
  it('expires at exactly 24 hours, not before', () => {
    expect(VIDEO_LIFETIME_MS).toBe(86400000);
    expect(videoExpired(deadline, published + 86400000 - 1)).toBe(false);
    expect(videoExpired(deadline, published + 86400000)).toBe(true);
  });
  it('never signs a read URL beyond the 24-hour deadline', () => {
    expect(videoUrlLifetime(deadline, published)).toBe(3600);
    expect(videoUrlLifetime(deadline, published + 86400000 - 9500)).toBe(9);
    expect(videoUrlLifetime(deadline, published + 86400000)).toBe(0);
  });
  it('permanently deletes the actual file before deleting the video record', async () => {
    const calls: string[] = [];
    const result = await deleteExpiredVideos([{ id: 'expired', storage_path: 'owner/video.mp4' }], async path => { calls.push(`file:${path}`); }, async id => { calls.push(`row:${id}`); });
    expect(calls).toEqual(['file:owner/video.mp4', 'row:expired']);
    expect(result).toEqual({ deleted: 1, failed: 0 });
  });
  it('retains the record for retry when the file could not be deleted', async () => {
    const rows: string[] = [];
    const result = await deleteExpiredVideos([{ id: 'retry', storage_path: 'owner/video.mp4' }], async () => { throw new Error('unavailable'); }, async id => { rows.push(id); });
    expect(rows).toEqual([]);
    expect(result).toEqual({ deleted: 0, failed: 1 });
  });
});