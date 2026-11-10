import { serve } from './rpc';
import { runJob, type SimJob, type SimResult } from '../sim/tournament';

serve<SimJob, SimResult>(runJob);
