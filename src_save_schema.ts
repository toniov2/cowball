import { z } from 'zod';

export const SAVE_VERSION = 2;

const matchSchema = z
  .object({
    a: z.string(),
    b: z.string(),
    ga: z.number(),
    gb: z.number(),
    pa: z.number(),
    pb: z.number(),
    done: z.boolean(),
  })
  .passthrough();
const roundSchema = z
  .object({
    name: z.string(),
    stage: z.enum(['qf', 'sf', 'final']).optional(),
    ko: z.boolean(),
    matches: z.array(matchSchema),
  })
  .passthrough();
export const compSchema = z
  .object({
    type: z.string(),
    my: z.string(),
    ids: z.array(z.string()),
    rounds: z.array(roundSchema),
    cur: z.number(),
    done: z.boolean(),
    champion: z.string().nullable(),
    out: z.boolean(),
  })
  .passthrough();

const pct = z.number().min(0).max(100);

/** Known fields are validated; unknown ones pass through untouched, because the legacy core keeps adding keys (settings, career, UT...). */
export const saveSchema = z
  .object({
    schemaVersion: z.literal(SAVE_VERSION),
    lang: z.string().default('ru'),
    myTeam: z.string().default('bur'),
    wins: z.number().int().min(0).default(0),
    played: z.number().int().min(0).default(0),
    goals: z.number().int().min(0).default(0),
    tutDone: z.boolean().default(false),
    trophies: z.array(z.unknown()).default([]),
    comp: compSchema.nullable().default(null),
    vMaster: pct.default(80),
    vMusic: pct.default(55),
    vSfx: pct.default(85),
  })
  .passthrough();

export type SaveV2 = z.infer<typeof saveSchema>;
