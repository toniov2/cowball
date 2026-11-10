import { Rng } from './core/rng';
import { FixedStepLoop } from './core/loop';
import { Fsm } from './core/fsm';
import { GAME_STATES, isGameState, type GameState } from './core/game-states';
import { migrate } from './save/migrations';
import { listHistory, readLatest, writeSnapshot } from './save/storage';
import { initI18n, t } from './i18n';
import { Profiler } from './perf/profiler';
import { recommendTier, type Tier } from './perf/quality';
import { createSimClient } from './workers';
import { runJob } from './sim/tournament';

interface LegacyHook {
  renderer?: { info?: unknown };
  onState?: (from: string, to: string) => void;
  onSave?: (payload: string) => void;
}
type Win = Window & {
  CowballV2Hook?: LegacyHook;
  Cowball2?: unknown;
  CowballTest?: { state: string; settings(): { lang?: string; gfx?: string } };
  __cbErrors?: unknown[];
};
const w = window as Win;

const log = (e: unknown) => {
  (w.__cbErrors ??= []).push(String(e));
};
const fsm = new Fsm<GameState>('menu');
const profiler = new Profiler();
const hook: LegacyHook = (w.CowballV2Hook ??= {});
const saveStatus = { mirrored: 0, rejected: 0, lastError: '' as string, restored: false };

hook.onState = (_from, to) => {
  if (isGameState(to)) fsm.observe(to);
};
hook.onSave = (payload) => {
  const r = migrate(
    (() => {
      try {
        return JSON.parse(payload);
      } catch {
        return null;
      }
    })(),
  );
  if (!r.ok) {
    saveStatus.rejected++;
    saveStatus.lastError = r.error;
    log('save rejected: ' + r.error);
    return;
  }
  writeSnapshot(JSON.stringify(r.save)).then(() => {
    saveStatus.mirrored++;
  }, log);
};
if (w.CowballTest && isGameState(w.CowballTest.state)) fsm.observe(w.CowballTest.state);

/** Restore a lost localStorage save from the IndexedDB mirror (reload once: the legacy core has already read storage at startup). */
async function restoreIfLost(): Promise<void> {
  let has: boolean;
  try {
    has = !!localStorage.getItem('cowball');
  } catch {
    return;
  }
  if (has || sessionStorage.getItem('cb2-restored')) return;
  const snap = await readLatest();
  if (!snap) return;
  localStorage.setItem('cowball', snap.json);
  sessionStorage.setItem('cb2-restored', '1');
  saveStatus.restored = true;
  location.reload();
}

const sim = createSimClient();

async function boot() {
  profiler.getRenderer = () => hook.renderer as { info?: never } | undefined;
  profiler.start();
  let lang = 'ru';
  try {
    lang = w.CowballTest?.settings().lang ?? JSON.parse(localStorage.getItem('cowball') || '{}').lang ?? 'ru';
  } catch (e) {
    log(e);
  }
  await initI18n(lang);
  await restoreIfLost().catch(log);
}

w.Cowball2 = {
  version: '51.0',
  states: GAME_STATES,
  fsm,
  Rng,
  FixedStepLoop,
  sim: { run: runJob, client: sim },
  save: { migrate, readLatest, listHistory, status: saveStatus },
  perf: {
    profiler,
    snapshot: () => profiler.snapshot(),
    recommend: (current?: Tier) =>
      recommendTier(current ?? ((w.CowballTest?.settings().gfx as Tier) || 'ultra'), profiler.stats.report()),
  },
  t,
};

boot().catch(log);
