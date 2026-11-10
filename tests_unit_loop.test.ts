import { describe, expect, it } from 'vitest';
import { FixedStepLoop } from '../../src/core/loop';

describe('FixedStepLoop', () => {
  it('runs a whole number of fixed steps regardless of frame rate', () => {
    for (const fps of [30, 60, 144]) {
      const l = new FixedStepLoop();
      let steps = 0;
      for (let i = 0; i < fps * 2; i++) l.advance(1 / fps, () => steps++);
      expect(Math.abs(steps - 120)).toBeLessThanOrEqual(1);
    }
  });
  it('identical update sequence at 30 and 144 FPS (determinism of step count)', () => {
    const run = (fps: number) => {
      const l = new FixedStepLoop();
      let t = 0;
      for (let i = 0; i < fps; i++) l.advance(1 / fps, (dt) => (t += dt));
      return Math.round(t * 60);
    };
    expect(Math.abs(run(30) - run(144))).toBeLessThanOrEqual(1);
  });
  it('clamps long frames and drops backlog', () => {
    const l = new FixedStepLoop();
    let n = 0;
    l.advance(10, () => n++);
    expect(n).toBeLessThanOrEqual(8);
    expect(l.advance(0, () => n++)).toBe(0);
  });
  it('returns interpolation alpha in [0,1]', () => {
    const a = new FixedStepLoop().advance(1 / 60 + 0.004, () => {});
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(1);
  });
});
