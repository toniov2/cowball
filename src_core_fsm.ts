/** Small typed finite-state machine. Replaces "override setState with a wrapper" layering:
 *  listeners subscribe here instead of wrapping the function. */
export type Listener<S extends string> = (to: S, from: S) => void;

export class Fsm<S extends string> {
  private cur: S;
  private readonly enter = new Map<S, Set<Listener<S>>>();
  private readonly exit = new Map<S, Set<Listener<S>>>();
  private readonly any = new Set<Listener<S>>();
  private readonly edges = new Map<string, number>();
  private readonly allowed: Map<S, ReadonlySet<S>> | null;

  /** @param table optional whitelist of transitions; when given, illegal transitions are rejected (strict mode). */
  constructor(initial: S, table?: Partial<Record<S, readonly S[]>>) {
    this.cur = initial;
    this.allowed = table
      ? new Map((Object.entries(table) as [S, readonly S[]][]).map(([k, v]) => [k, new Set(v)]))
      : null;
  }

  get state(): S {
    return this.cur;
  }

  can(to: S): boolean {
    if (!this.allowed) return true;
    return to === this.cur || (this.allowed.get(this.cur)?.has(to) ?? false);
  }

  /** Returns false (and changes nothing) if the transition is not allowed. */
  go(to: S): boolean {
    if (!this.can(to)) return false;
    return this.record(to);
  }

  /** Mirror a transition that has already happened elsewhere (the legacy core). Never rejects, always records. */
  observe(to: S): void {
    this.record(to);
  }

  private record(to: S): boolean {
    const from = this.cur;
    if (to === from) return true;
    this.exit.get(from)?.forEach((f) => f(to, from));
    this.cur = to;
    const key = `${from}>${to}`;
    this.edges.set(key, (this.edges.get(key) ?? 0) + 1);
    this.enter.get(to)?.forEach((f) => f(to, from));
    this.any.forEach((f) => f(to, from));
    return true;
  }

  onEnter(s: S, f: Listener<S>): () => void {
    return add(this.enter, s, f);
  }

  onExit(s: S, f: Listener<S>): () => void {
    return add(this.exit, s, f);
  }

  onChange(f: Listener<S>): () => void {
    this.any.add(f);
    return () => this.any.delete(f);
  }

  /** Transitions seen so far, as "from>to" -> count. Used to build a verified whitelist from real play. */
  observedEdges(): Record<string, number> {
    return Object.fromEntries(this.edges);
  }
}

function add<S extends string>(m: Map<S, Set<Listener<S>>>, k: S, f: Listener<S>): () => void {
  let set = m.get(k);
  if (!set) m.set(k, (set = new Set()));
  set.add(f);
  return () => set.delete(f);
}
