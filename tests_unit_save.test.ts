import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { migrate } from '../../src/save/migrations';
import { listHistory, readLatest, writeSnapshot } from '../../src/save/storage';

const legacyComp = {
  type: 'cup',
  my: 'bur',
  ids: ['bur', 'x'],
  cur: 0,
  done: false,
  champion: null,
  out: false,
  rounds: [
    {
      name: '1/4 финала',
      ko: true,
      matches: [{ a: 'bur', b: 'x', ga: 0, gb: 0, pa: 0, pb: 0, done: false }],
    },
  ],
};

describe('save migration', () => {
  it('v1 (no schemaVersion) -> v2, backfills round stage, keeps unknown keys', () => {
    const r = migrate({ lang: 'ru', wins: 3, careerX: { keep: 1 }, comp: legacyComp });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.from).toBe(1);
      expect(r.save.schemaVersion).toBe(2);
      expect(r.save.comp?.rounds[0]?.stage).toBe('qf');
      expect((r.save as Record<string, unknown>).careerX).toEqual({ keep: 1 });
    }
  });
  it('does not mutate the input', () => {
    const input = { comp: structuredClone(legacyComp) };
    migrate(input);
    expect((input.comp.rounds[0] as { stage?: string }).stage).toBeUndefined();
  });
  it('rejects garbage and bad field types', () => {
    expect(migrate(null).ok).toBe(false);
    expect(migrate([]).ok).toBe(false);
    expect(migrate({ wins: -5 }).ok).toBe(false);
    expect(migrate({ vMaster: 400 }).ok).toBe(false);
  });
  it('rejects saves from a newer version', () => {
    expect(migrate({ schemaVersion: 99 }).ok).toBe(false);
  });
  it('is idempotent on v2 data', () => {
    const a = migrate({ wins: 1 });
    expect(a.ok).toBe(true);
    if (a.ok) {
      const b = migrate(a.save);
      expect(b.ok && b.from).toBe(2);
    }
  });
});

describe('IndexedDB snapshots', () => {
  it('stores latest and keeps at most 5 history entries, one per minute', async () => {
    for (let i = 0; i < 8; i++) await writeSnapshot(JSON.stringify({ n: i }), 1_000_000 + i * 61_000);
    await writeSnapshot('{"n":"too-soon"}', 1_000_000 + 7 * 61_000 + 1000);
    expect((await readLatest())?.json).toBe('{"n":"too-soon"}');
    const h = await listHistory();
    expect(h.length).toBe(5);
    expect(h.some((x) => x.json.includes('too-soon'))).toBe(false);
  });
});
