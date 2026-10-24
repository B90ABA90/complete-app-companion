export function videoShareUrl(origin: string, videoId: string) {
  return new URL(`/video/${encodeURIComponent(videoId)}`, origin).href;
}