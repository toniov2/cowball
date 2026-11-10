/** Match/UI states of the legacy core. The list comes from `grep "setState('...')"` in cowball-core.js (v51),
 *  plus 'menu' and 'play' which the core also assigns directly. */
export const GAME_STATES = [
  'menu',
  'ready',
  'play',
  'goal',
  'replay',
  'pens',
  'rule',
  'paused',
  'outro',
  'end',
] as const;
export type GameState = (typeof GAME_STATES)[number];

export const isGameState = (s: unknown): s is GameState =>
  typeof s === 'string' && (GAME_STATES as readonly string[]).includes(s);
