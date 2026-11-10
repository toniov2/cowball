import { SAVE_VERSION, saveSchema, type SaveV2 } from './schema';

type Raw = Record<string, unknown>;
/** Same table as ROUND_STAGE_LEGACY_V50 in the core: old saves have only display names. */
const LEGACY_STAGE: Record<string, string> = { '1/4 финала': 'qf', '1/2 финала': 'sf', Финал: 'final' };

/** Each step turns version N into N+1. Version 1 = the legacy flat object without `schemaVersion`. */
const steps: Record<number, (s: Raw) => Raw> = {
  1: (s) => {
    const out: Raw = { ...s };
    const comp = out.comp as Raw | null | undefined;
    if (comp && Array.isArray(comp.rounds)) {
      comp.rounds = (comp.rounds as Raw[]).map((r) => {
        const stage = r.stage ?? LEGACY_STAGE[String(r.name)];
        return stage ? { ...r, stage } : r;
      });
    }
    out.schemaVersion = 2;
    return out;
  },
};

export type MigrateResult = { ok: true; save: SaveV2; from: number } | { ok: false; error: string };

export function migrate(input: unknown): MigrateResult {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return { ok: false, error: 'save is not an object' };
  let cur = structuredClone(input) as Raw;
  const from = typeof cur.schemaVersion === 'number' ? cur.schemaVersion : 1;
  if (from > SAVE_VERSION)
    return { ok: false, error: `save version ${from} is newer than supported ${SAVE_VERSION}` };
  for (let v = from; v < SAVE_VERSION; v++) {
    const step = steps[v];
    if (!step) return { ok: false, error: `no migration from ${v}` };
    cur = step(cur);
  }
  const parsed = saveSchema.safeParse(cur);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    };
  return { ok: true, save: parsed.data, from };
}
