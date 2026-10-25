/** Videos open in a modal on the single home page; the address carries the video id as ?v=… */
export type VideoSearch = { v?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseVideoSearch(search: Record<string, unknown>): VideoSearch {
  return typeof search['v'] === 'string' && UUID.test(search['v']) ? { v: search['v'] } : {};
}

export function videoShareUrl(origin: string, videoId: string) {
  const url = new URL('/', origin);
  url.searchParams.set('v', videoId);
  return url.href;
}
