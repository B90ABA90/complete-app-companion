import { describe, it, expect } from 'vitest';
import { canRequestStage, hasFreeSlot, slowModeWait } from '@/lives/lib/live';
describe('live rules', () => {
  it('refuses stage requests when policy is nobody', () => { expect(canRequestStage('nobody', true)).toBe(false); });
  it('followers-only requires following', () => { expect(canRequestStage('followers', false)).toBe(false); expect(canRequestStage('followers', true)).toBe(true); });
  it('guest slots are a hard limit', () => { expect(hasFreeSlot(3, 2)).toBe(true); expect(hasFreeSlot(3, 3)).toBe(false); });
  it('slow mode of 10 s blocks a message sent 4 s later', () => { expect(slowModeWait(10, 0, 4000)).toBe(6); expect(slowModeWait(10, 0, 10000)).toBe(0); });
});
