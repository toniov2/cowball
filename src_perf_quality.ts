import type { PerfReport } from './profiler';

/** Same preset names as settings.gfx in the core (min/low/med/high/ultra). */
export const TIERS = ['min', 'low', 'med', 'high', 'ultra'] as const;
export type Tier = (typeof TIERS)[number];

/** Decide a quality tier from measured frame times. Pure function: down fast (p95 over budget), up slowly (lots of headroom). */
export function recommendTier(current: Tier, r: PerfReport, targetFps = 60): Tier {
  if (r.frames < 120) return current; // not enough data
  const i = TIERS.indexOf(current);
  const budget = 1000 / targetFps;
  if (r.avgMs > budget * 1.25 || r.p95Ms > budget * 2) return TIERS[Math.max(0, i - 1)] as Tier;
  if (r.p95Ms < budget * 0.8 && i < TIERS.length - 1) return TIERS[i + 1] as Tier;
  return current;
}
