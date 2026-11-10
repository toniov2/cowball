import { WorkerClient } from './rpc';
import { runJob, type SimJob, type SimResult } from '../sim/tournament';

/** Tournament simulation off the main thread. Physics and AI workers arrive with Phase 3: the physics/AI code still lives in the core. */
export const createSimClient = () =>
  new WorkerClient<SimJob, SimResult>(
    () => new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' }),
    runJob,
  );
