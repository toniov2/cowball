export interface PerfReport {
  frames: number;
  fps: number;
  avgMs: number;
  p95Ms: number;
  worstMs: number;
}

/** Collects frame times (ms). Pure: feed it numbers from any clock. */
export class FrameStats {
  private buf: number[] = [];
  constructor(private readonly cap = 240) {}
  push(ms: number): void {
    this.buf.push(ms);
    if (this.buf.length > this.cap) this.buf.shift();
  }
  report(): PerfReport {
    const n = this.buf.length;
    if (!n) return { frames: 0, fps: 0, avgMs: 0, p95Ms: 0, worstMs: 0 };
    const sorted = [...this.buf].sort((a, b) => a - b);
    const avg = this.buf.reduce((a, b) => a + b, 0) / n;
    return {
      frames: n,
      fps: 1000 / avg,
      avgMs: avg,
      p95Ms: sorted[Math.min(n - 1, Math.floor(n * 0.95))] as number,
      worstMs: sorted[n - 1] as number,
    };
  }
  clear(): void {
    this.buf = [];
  }
}

export interface RendererInfoLike {
  render?: { calls?: number; triangles?: number };
  memory?: { geometries?: number; textures?: number };
}

/** Measures real frame intervals by wrapping requestAnimationFrame, so it works without touching the legacy loop. */
export class Profiler {
  readonly stats = new FrameStats();
  private last = 0;
  private started = false;
  /** Resolved lazily: the legacy core creates its renderer after Three.js has loaded, which can be later than this module. */
  getRenderer: () => { info?: RendererInfoLike } | null | undefined = () => null;

  start(): void {
    if (this.started) return;
    this.started = true;
    const tick = (now: number) => {
      if (this.last) this.stats.push(now - this.last);
      this.last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  snapshot() {
    const info = this.getRenderer()?.info;
    const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    return {
      ...this.stats.report(),
      drawCalls: info?.render?.calls ?? null,
      triangles: info?.render?.triangles ?? null,
      geometries: info?.memory?.geometries ?? null,
      textures: info?.memory?.textures ?? null,
      heapMB: mem ? Math.round(mem.usedJSHeapSize / 1048576) : null,
    };
  }
}
