export const VIDEO_LIFETIME_MS = 24 * 60 * 60 * 1000;

export function videoExpired(expiresAt: string, now = Date.now()) {
  return Date.parse(expiresAt) <= now;
}

export function videoUrlLifetime(expiresAt: string, now = Date.now()) {
  return Math.max(0, Math.min(3600, Math.floor((Date.parse(expiresAt) - now) / 1000)));
}

export type ExpiredVideo = { id: string; storage_path: string | null };
export async function deleteExpiredVideos(videos: ExpiredVideo[], removeFile: (path: string) => Promise<void>, removeRow: (id: string) => Promise<void>) {
  let deleted = 0;
  let failed = 0;
  for (const video of videos) {
    try {
      // Keep the row if Storage fails, so the next scheduled run can retry.
      if (video.storage_path) await removeFile(video.storage_path);
      await removeRow(video.id);
      deleted++;
    } catch {
      failed++;
    }
  }
  return { deleted, failed };
}