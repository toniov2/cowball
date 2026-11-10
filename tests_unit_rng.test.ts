import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/core/rng';

describe('Rng', () => {
  it('same seed -> same sequence', () => {
    const a = new Rng(42),
      b = new Rng(42);
    expect(Array.from({ length: 50 }, () => a.next())).toEqual(Array.from({ length: 50 }, () => b.next()));
  });
  it('different seeds differ; values in [0,1)', () => {
    const a = new Rng(1),
      b = new Rng(2);
    expect(a.next()).not.toBe(b.next());
    const r = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('seed 0 behaves like 1 (legacy rule)', () => {
    expect(new Rng(0).next()).toBe(new Rng(1).next());
  });
  it('shuffle keeps elements and is reproducible', () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8];
    const s1 = new Rng(5).shuffle(src),
      s2 = new Rng(5).shuffle(src);
    expect(s1).toEqual(s2);
    expect([...s1].sort()).toEqual(src);
    expect(src).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
  it('state can be saved and restored', () => {
    const r = new Rng(9);
    r.next();
    const st = r.state;
    const x = r.next();
    const r2 = new Rng(1);
    r2.state = st;
    expect(r2.next()).toBe(x);
  });
  it('pick throws on empty array', () => {
    expect(() => new Rng(1).pick([])).toThrow();
  });
});
