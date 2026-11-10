/** Port of the tournament logic from cowball-core.js (newComp / compPlay / compAfterRound / compSimRest) onto the seeded Rng.
 *  Draw order is identical to the legacy code, so a seed gives the same tournament (verified by tests/e2e/parity.spec.ts). */
import { Rng } from '../core/rng';

export interface TeamLite {
  id: string;
  spd: number;
  pow: number;
  def: number;
  nation?: boolean;
  league?: string;
}
export interface Match {
  a: string;
  b: string;
  ga: number;
  gb: number;
  pa: number;
  pb: number;
  done: boolean;
  grp: string;
}
export interface Round {
  name: string;
  stage?: 'qf' | 'sf' | 'final';
  ko: boolean;
  matches: Match[];
}
export interface Comp {
  type: string;
  my: string;
  ids: string[];
  rounds: Round[];
  cur: number;
  done: boolean;
  champion: string | null;
  out: boolean;
}

const power = (t: TeamLite) => (t.spd + t.pow + t.def) / 3;
const mk = (a: string, b: string, grp = ''): Match => ({
  a,
  b,
  ga: 0,
  gb: 0,
  pa: 0,
  pb: 0,
  done: false,
  grp,
});

export function matchWinner(m: Match | null): string | null {
  if (!m) return null;
  if (m.ga !== m.gb) return m.ga > m.gb ? m.a : m.b;
  if (m.pa !== m.pb) return m.pa > m.pb ? m.a : m.b;
  return null;
}

export class TournamentSim {
  private readonly byId = new Map<string, TeamLite>();
  constructor(
    private readonly teams: readonly TeamLite[],
    private readonly rng: Rng,
  ) {
    teams.forEach((t) => this.byId.set(t.id, t));
  }
  private team(id: string): TeamLite {
    return this.byId.get(id) ?? (this.teams[0] as TeamLite);
  }

  private poisson(l: number): number {
    const L = Math.exp(-l);
    let k = 0,
      p = 1;
    do {
      k++;
      p *= this.rng.next();
    } while (p > L && k < 12);
    return k - 1;
  }
  private score(a: string, b: string) {
    const A = power(this.team(a)),
      B = power(this.team(b));
    return {
      ga: Math.min(6, this.poisson(1.25 * Math.pow(A / B, 0.9))),
      gb: Math.min(6, this.poisson(1.25 * Math.pow(B / A, 0.9))),
    };
  }
  private pens(a: string, b: string) {
    const pa0 = 0.72 + 0.03 * (this.team(a).pow - 3),
      pb0 = 0.72 + 0.03 * (this.team(b).pow - 3);
    let pa = 0,
      pb = 0;
    for (let i = 0; i < 5; i++) {
      if (this.rng.next() < pa0) pa++;
      if (this.rng.next() < pb0) pb++;
    }
    let n = 0;
    while (pa === pb && n++ < 30) {
      if (this.rng.next() < pa0) pa++;
      if (this.rng.next() < pb0) pb++;
    }
    if (pa === pb) pa++;
    return { pa, pb };
  }
  private static rr(ids: string[]): [string, string][][] {
    const n = ids.length,
      arr = ids.slice(),
      rounds: [string, string][][] = [];
    for (let r = 0; r < n - 1; r++) {
      const m: [string, string][] = [];
      for (let i = 0; i < n / 2; i++) m.push([arr[i] as string, arr[n - 1 - i] as string]);
      rounds.push(m);
      arr.splice(1, 0, arr.pop() as string);
    }
    return rounds;
  }

  newComp(type: string, my: string): Comp {
    const T = this.teams;
    const pool =
      type === 'world'
        ? T.filter((t) => t.nation)
        : type.startsWith('league_')
          ? T.filter((t) => t.league === type.slice(7))
          : T.filter((t) => !t.nation && !t.league);
    const eligible = pool.some((t) => t.id === my) ? pool : pool.length ? pool : T;
    const ids = type.startsWith('league_')
      ? this.rng.shuffle(eligible.map((t) => t.id))
      : this.rng.shuffle(
          [my].concat(
            this.rng
              .shuffle(eligible.filter((t) => t.id !== my))
              .slice(0, 7)
              .map((t) => t.id),
          ),
        );
    if (!ids.includes(my)) ids[0] = my;
    const c: Comp = { type, my, ids, rounds: [], cur: 0, done: false, champion: null, out: false };
    if (type === 'league' || type.startsWith('league_')) {
      TournamentSim.rr(ids).forEach((r, i) =>
        c.rounds.push({ name: 'Тур ' + (i + 1), ko: false, matches: r.map((p) => mk(p[0], p[1], 'L')) }),
      );
    } else if (type === 'ucl') {
      TournamentSim.rr(ids)
        .slice(0, 4)
        .forEach((r, i) =>
          c.rounds.push({
            name: 'Общий этап, тур ' + (i + 1),
            ko: false,
            matches: r.map((p) => mk(p[0], p[1], 'L')),
          }),
        );
    } else if (type === 'world') {
      const A = TournamentSim.rr(ids.slice(0, 4)),
        B = TournamentSim.rr(ids.slice(4, 8));
      for (let i = 0; i < 3; i++)
        c.rounds.push({
          name: 'Группы, тур ' + (i + 1),
          ko: false,
          matches: (A[i] as [string, string][])
            .map((p) => mk(p[0], p[1], 'A'))
            .concat((B[i] as [string, string][]).map((p) => mk(p[0], p[1], 'B'))),
        });
    } else {
      c.rounds.push({
        name: '1/4 финала',
        stage: 'qf',
        ko: true,
        matches: [0, 2, 4, 6].map((i) => mk(ids[i] as string, ids[i + 1] as string)),
      });
    }
    return c;
  }

  standings(c: Comp, grp: string) {
    const t: Record<
      string,
      { id: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number }
    > = {};
    c.rounds.forEach((r) =>
      r.matches.forEach((m) => {
        if (m.grp !== grp) return;
        for (const id of [m.a, m.b]) t[id] ??= { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
        if (!m.done) return;
        const A = t[m.a]!,
          B = t[m.b]!;
        A.p++;
        B.p++;
        A.gf += m.ga;
        A.ga += m.gb;
        B.gf += m.gb;
        B.ga += m.ga;
        if (m.ga > m.gb) {
          A.w++;
          B.l++;
          A.pts += 3;
        } else if (m.ga < m.gb) {
          B.w++;
          A.l++;
          B.pts += 3;
        } else {
          A.d++;
          B.d++;
          A.pts++;
          B.pts++;
        }
      }),
    );
    return Object.values(t).sort(
      (x, y) => y.pts - x.pts || y.gf - y.ga - (x.gf - x.ga) || y.gf - x.gf || (x.id < y.id ? -1 : 1),
    );
  }

  play(c: Comp, ures: { gm: number; go: number; pm?: number; po?: number } | null): void {
    const r = c.rounds[c.cur] as Round;
    r.matches.forEach((m) => {
      if (m.done) return;
      const mine = m.a === c.my || m.b === c.my;
      if (mine && ures) {
        const a = m.a === c.my;
        m.ga = a ? ures.gm : ures.go;
        m.gb = a ? ures.go : ures.gm;
        m.pa = a ? ures.pm || 0 : ures.po || 0;
        m.pb = a ? ures.po || 0 : ures.pm || 0;
      } else {
        const s = this.score(m.a, m.b);
        m.ga = s.ga;
        m.gb = s.gb;
        if (r.ko && m.ga === m.gb) {
          const p = this.pens(m.a, m.b);
          m.pa = p.pa;
          m.pb = p.pb;
        }
      }
      if (r.ko && matchWinner(m) === null) {
        let p = this.pens(m.a, m.b),
          n = 0;
        while (p.pa === p.pb && n++ < 20) p = this.pens(m.a, m.b);
        m.pa = p.pa;
        m.pb = p.pb + (p.pa === p.pb ? 1 : 0);
      }
      m.done = true;
    });
    if (r.ko && !r.matches.some((m) => matchWinner(m) === c.my && (m.a === c.my || m.b === c.my)))
      c.out = true;
    this.after(c);
  }

  private after(c: Comp): void {
    const r = c.rounds[c.cur] as Round;
    if (c.cur < c.rounds.length - 1) {
      c.cur++;
      return;
    }
    if (r.stage === 'final') {
      c.done = true;
      c.champion = matchWinner(r.matches[0] as Match);
      return;
    }
    if (c.type === 'league' || c.type.startsWith('league_')) {
      c.done = true;
      c.champion = (this.standings(c, 'L')[0] as { id: string }).id;
      return;
    }
    let nxt: Round;
    if (r.ko) {
      const w = r.matches.map(matchWinner) as string[];
      nxt =
        w.length === 4
          ? { name: '1/2 финала', stage: 'sf', ko: true, matches: [mk(w[0]!, w[1]!), mk(w[2]!, w[3]!)] }
          : { name: 'Финал', stage: 'final', ko: true, matches: [mk(w[0]!, w[1]!)] };
    } else if (c.type === 'ucl') {
      const t = this.standings(c, 'L');
      nxt = {
        name: '1/2 финала',
        stage: 'sf',
        ko: true,
        matches: [mk(t[0]!.id, t[3]!.id), mk(t[1]!.id, t[2]!.id)],
      };
    } else {
      const A = this.standings(c, 'A'),
        B = this.standings(c, 'B');
      nxt = {
        name: '1/2 финала',
        stage: 'sf',
        ko: true,
        matches: [mk(A[0]!.id, B[1]!.id), mk(B[0]!.id, A[1]!.id)],
      };
    }
    if (!nxt.matches.some((m) => m.a === c.my || m.b === c.my)) c.out = true;
    c.rounds.push(nxt);
    c.cur++;
  }

  simRest(c: Comp): Comp {
    let n = 0;
    while (!c.done && n++ < 40) this.play(c, null);
    return c;
  }
}

export interface SimJob {
  teams: TeamLite[];
  type: string;
  my: string;
  seed: number;
  count?: number;
}
export interface SimResult {
  comps: Comp[];
  champions: Record<string, number>;
}

/** Runs `count` independent tournaments from consecutive seeds (seed, seed+1, ...). Pure and worker-safe. */
export function runJob(job: SimJob): SimResult {
  const count = Math.max(1, job.count ?? 1);
  const comps: Comp[] = [];
  const champions: Record<string, number> = {};
  for (let i = 0; i < count; i++) {
    const sim = new TournamentSim(job.teams, new Rng(job.seed + i));
    const c = sim.simRest(sim.newComp(job.type, job.my));
    comps.push(c);
    if (c.champion) champions[c.champion] = (champions[c.champion] ?? 0) + 1;
  }
  return { comps, champions };
}
