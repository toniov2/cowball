import { expect, test } from '@playwright/test';
import { openGame } from './helpers';

test('TS tournament sim == legacy core for the same seed (all competition types, 40 seeds each)', async ({
  page,
}) => {
  await openGame(page);
  const res = await page.evaluate(() => {
    const w = window as unknown as Record<string, any>;
    const T = w.CowballTest,
      teams = T.TEAMS().map((t: any) => ({
        id: t.id,
        spd: t.spd,
        pow: t.pow,
        def: t.def,
        nation: t.nation,
        league: t.league,
      }));
    const strip = (c: any) => JSON.parse(JSON.stringify(c));
    const out: Record<string, { n: number; bad: number[] }> = {};
    const club = teams.find((t: any) => !t.nation && !t.league).id;
    const nation = teams.find((t: any) => t.nation).id;
    const lg = teams.find((t: any) => t.league === 'premier');
    for (const type of ['league', 'cup', 'ucl', 'world', 'league_premier']) {
      const my = type === 'world' ? nation : type === 'league_premier' ? (lg ? lg.id : club) : club;
      const bad: number[] = [];
      for (let seed = 1; seed <= 40; seed++) {
        T.seedRng(seed);
        const legacy = strip(T.newComp(type, my));
        T.compSimRest(legacy);
        const mine = strip(w.Cowball2.sim.run({ teams, type, my, seed }).comps[0]);
        // legacy objects may carry extra fields; compare the fields the port models
        const pick = (c: any) => ({
          ids: c.ids,
          champion: c.champion,
          done: c.done,
          out: c.out,
          rounds: c.rounds.map((r: any) => ({
            s: r.stage,
            m: r.matches.map((m: any) => [m.a, m.b, m.ga, m.gb, m.pa, m.pb]),
          })),
        });
        if (JSON.stringify(pick(legacy)) !== JSON.stringify(pick(mine))) bad.push(seed);
      }
      out[type] = { n: 40, bad };
    }
    return out;
  });
  for (const [type, r] of Object.entries(res)) expect(r.bad, type).toEqual([]);
});

test('simulation runs in a Web Worker and matches the main-thread result', async ({ page }) => {
  await openGame(page);
  const r = await page.evaluate(async () => {
    const w = window as unknown as Record<string, any>;
    const teams = w.CowballTest.TEAMS().map((t: any) => ({
      id: t.id,
      spd: t.spd,
      pow: t.pow,
      def: t.def,
      nation: t.nation,
      league: t.league,
    }));
    const my = teams.find((t: any) => !t.nation && !t.league).id;
    const job = { teams, type: 'cup', my, seed: 11, count: 200 };
    const viaWorker = await w.Cowball2.sim.client.call(job);
    return {
      usesWorker: w.Cowball2.sim.client.usesWorker,
      same: JSON.stringify(viaWorker) === JSON.stringify(w.Cowball2.sim.run(job)),
    };
  });
  expect(r.usesWorker).toBe(true);
  expect(r.same).toBe(true);
});
