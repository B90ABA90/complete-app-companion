import { describe, expect, it } from 'vitest';
import { recordLimitSeconds, ringOffset } from '@/videos/lib/recorder-rules';

describe('hold-to-record rules', () => {
  it('stops at the chosen duration without a sound', () => {
    expect(recordLimitSeconds(60, null)).toBe(60);
  });
  it('stops when a shorter added sound ends', () => {
    expect(recordLimitSeconds(180, 42)).toBe(42);
  });
  it('keeps the chosen duration when the sound is longer', () => {
    expect(recordLimitSeconds(15, 200)).toBe(15);
  });
  it('fills the ring as the take progresses', () => {
    expect(ringOffset(0, 10, 100)).toBe(100);
    expect(ringOffset(5000, 10, 100)).toBe(50);
    expect(ringOffset(20000, 10, 100)).toBe(0);
  });
});
