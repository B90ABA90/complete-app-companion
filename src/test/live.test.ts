import { describe, it, expect } from 'vitest';
import { isStreamUrl } from '@/lives/lib/live';
describe('isStreamUrl', () => {
  it('accepts Cloudflare Stream players', () => { expect(isStreamUrl('https://customer-abc123.cloudflarestream.com/uid/iframe')).toBe(true); });
  it('rejects other hosts', () => { expect(isStreamUrl('https://evil.com/customer-abc.cloudflarestream.com')).toBe(false); expect(isStreamUrl('javascript:alert(1)')).toBe(false); });
});
