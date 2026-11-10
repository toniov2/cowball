/** Minimal typed request/response layer over a Worker. Falls back to running the handler on the main thread when Workers are unavailable. */
export type Handler<I, O> = (input: I) => O | Promise<O>;

export class WorkerClient<I, O> {
  private worker: Worker | null;
  private seq = 0;
  private pending = new Map<number, { res: (v: O) => void; rej: (e: Error) => void }>();

  constructor(
    make: () => Worker,
    private readonly fallback: Handler<I, O>,
  ) {
    try {
      this.worker = make();
      this.worker.onmessage = (e: MessageEvent<{ id: number; ok: boolean; out?: O; err?: string }>) => {
        const p = this.pending.get(e.data.id);
        if (!p) return;
        this.pending.delete(e.data.id);
        if (e.data.ok) p.res(e.data.out as O);
        else p.rej(new Error(e.data.err));
      };
      this.worker.onerror = () => this.fail('worker crashed');
    } catch {
      this.worker = null;
    }
  }

  get usesWorker(): boolean {
    return this.worker !== null;
  }

  call(input: I): Promise<O> {
    const w = this.worker;
    if (!w) return Promise.resolve(this.fallback(input));
    const id = ++this.seq;
    return new Promise<O>((res, rej) => {
      this.pending.set(id, { res, rej });
      w.postMessage({ id, input });
    });
  }

  private fail(msg: string): void {
    this.pending.forEach((p) => p.rej(new Error(msg)));
    this.pending.clear();
  }

  terminate(): void {
    this.worker?.terminate();
    this.fail('terminated');
  }
}

/** Worker side: `serve(handler)` answers every {id, input} message. */
export function serve<I, O>(handler: Handler<I, O>): void {
  const scope = self as unknown as {
    onmessage: ((e: MessageEvent<{ id: number; input: I }>) => void) | null;
    postMessage(m: unknown): void;
  };
  scope.onmessage = async (e) => {
    try {
      scope.postMessage({ id: e.data.id, ok: true, out: await handler(e.data.input) });
    } catch (err) {
      scope.postMessage({ id: e.data.id, ok: false, err: String(err) });
    }
  };
}
