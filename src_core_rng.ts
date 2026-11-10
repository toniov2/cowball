/** Deterministic PRNG (mulberry32). Same algorithm and seeding as `rngV50` in cowball-core.js,
 *  so a seed gives identical sequences in the legacy core and in the new code (checked by the e2e parity test). */
export class Rng {
  private s: number;

  constructor(seed: number) {
    this.s = Number(seed) >>> 0 || 1;
  }

  /** Float in [0, 1). */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(a: number, b: number): number {
    return a + this.next() * (b - a);
  }

  /** Integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new RangeError('pick from empty array');
    return arr[this.int(arr.length)] as T;
  }

  /** Returns a shuffled copy (Fisher-Yates, same order of draws as the legacy `shuffle`). */
  shuffle<T>(arr: readonly T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [a[i], a[j]] = [a[j] as T, a[i] as T];
    }
    return a;
  }

  /** Independent stream derived from this one and a label (does not advance when labels differ in order of use). */
  fork(label: string): Rng {
    let h = 2166136261 ^ this.s;
    for (let i = 0; i < label.length; i++) h = Math.imul(h ^ label.charCodeAt(i), 16777619);
    return new Rng(h >>> 0);
  }

  get state(): number {
    return this.s;
  }

  set state(v: number) {
    this.s = v >>> 0;
  }
}
