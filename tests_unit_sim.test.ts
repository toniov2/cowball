import { describe, expect, it } from 'vitest';
import { runJob, matchWinner, type TeamLite } from '../../src/sim/tournament';

const TEAMS: TeamLite[] = [
  ...Array.from({ length: 12 }, (_, i) => ({
    id: 'c' + i,
    spd: 2 + (i % 4),
    pow: 2 + ((i * 3) % 4),
    def: 3,
  })),
  ...Array.from({ length: 8 }, (_, i) => ({ id: 'n' + i, spd: 3, pow: 3 + (i % 3), def: 3, nation: true })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: 'p' + i, spd: 3, pow: 3, def: 3 + i, league: 'premier' })),
];
const TYPES = ['league', 'cup', 'ucl', 'world', 'league_premier'];

describe('tournament sim', () => {
  it('same seed -> identical tournament, for every competition type', () => {
    for (const type of TYPES) {
      const my = type === 'world' ? 'n0' : type === 'league_premier' ? 'p0' : 'c0';
      expect(runJob({ teams: TEAMS, type, my, seed: 7 })).toEqual(
        runJob({ teams: TEAMS, type, my, seed: 7 }),
      );
    }
  });
  it('every tournament finishes with a champion; knockouts never end level', () => {
    for (const type of TYPES) {
      const my = type === 'world' ? 'n0' : type === 'league_premier' ? 'p0' : 'c0';
      const { comps } = runJob({ teams: TEAMS, type, my, seed: 1, count: 40 });
      for (const c of comps) {
        expect(c.done).toBe(true);
        expect(c.champion).toBeTruthy();
        c.rounds
          .filter((r) => r.ko)
          .forEach((r) => r.matches.forEach((m) => expect(matchWinner(m)).not.toBeNull()));
      }
    }
  });
  it('different seeds give different results', () => {
    expect(runJob({ teams: TEAMS, type: 'league', my: 'c0', seed: 1, count: 30 }).champions).not.toEqual(
      runJob({ teams: TEAMS, type: 'league', my: 'c0', seed: 500, count: 30 }).champions,
    );
  });
});
