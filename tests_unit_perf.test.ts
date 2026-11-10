import { describe, expect, it } from 'vitest';
import { FrameStats } from '../../src/perf/profiler';
import { recommendTier } from '../../src/perf/quality';

const feed = (ms: number, n = 200) => {
  const s = new FrameStats();
  for (let i = 0; i < n; i++) s.push(ms);
  return s.report();
};
describe('perf', () => {
  it('computes fps and percentiles', () => {
    const r = feed(16.67);
    expect(Math.round(r.fps)).toBe(60);
    expect(r.p95Ms).toBeCloseTo(16.67);
  });
  it('lowers tier on slow frames, raises on big headroom, holds otherwise, waits for data', () => {
    expect(recommendTier('ultra', feed(40))).toBe('high');
    expect(recommendTier('min', feed(40))).toBe('min');
    expect(recommendTier('med', feed(8))).toBe('high');
    expect(recommendTier('ultra', feed(8))).toBe('ultra');
    expect(recommendTier('med', feed(16.5))).toBe('med');
    expect(recommendTier('ultra', feed(100, 10))).toBe('ultra');
  });
});
