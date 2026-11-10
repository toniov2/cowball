/** Fixed-timestep simulation: physics always advances in equal steps, independent of the display's frame rate.
 *  Pure logic (no requestAnimationFrame), so it is unit-testable and can run inside a Worker. */
export interface FixedStepOptions {
  /** Step length in seconds (default 1/60). */
  step?: number;
  /** Frame time is clamped to this value so a long pause does not cause a "spiral of death" (default 0.25 s). */
  maxFrame?: number;
  /** Upper bound of steps per frame (default 8). */
  maxSteps?: number;
}

export class FixedStepLoop {
  readonly step: number;
  private readonly maxFrame: number;
  private readonly maxSteps: number;
  private acc = 0;
  /** Total number of simulated steps; together with a seed it identifies a deterministic replay position. */
  ticks = 0;

  constructor(opts: FixedStepOptions = {}) {
    this.step = opts.step ?? 1 / 60;
    this.maxFrame = opts.maxFrame ?? 0.25;
    this.maxSteps = opts.maxSteps ?? 8;
  }

  /** Feed the real frame time; runs `update(step)` zero or more times. Returns the interpolation factor 0..1 for rendering. */
  advance(frameSeconds: number, update: (dt: number) => void): number {
    this.acc += Math.min(Math.max(frameSeconds, 0), this.maxFrame);
    let n = 0;
    while (this.acc >= this.step - 1e-9 && n < this.maxSteps) {
      update(this.step);
      this.acc -= this.step;
      this.ticks++;
      n++;
    }
    if (n === this.maxSteps) this.acc = 0; // drop the backlog instead of running ever further behind
    return Math.min(1, Math.max(0, this.acc / this.step));
  }

  reset(): void {
    this.acc = 0;
    this.ticks = 0;
  }
}
