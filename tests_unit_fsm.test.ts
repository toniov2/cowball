import { describe, expect, it } from 'vitest';
import { Fsm } from '../../src/core/fsm';

type S = 'a' | 'b' | 'c';
describe('Fsm', () => {
  it('notifies exit, enter and change in order', () => {
    const f = new Fsm<S>('a');
    const log: string[] = [];
    f.onExit('a', () => log.push('exit a'));
    f.onEnter('b', () => log.push('enter b'));
    f.onChange((to, from) => log.push(`${from}>${to}`));
    f.go('b');
    expect(log).toEqual(['exit a', 'enter b', 'a>b']);
  });
  it('strict table rejects illegal transitions', () => {
    const f = new Fsm<S>('a', { a: ['b'], b: ['c'] });
    expect(f.go('c')).toBe(false);
    expect(f.state).toBe('a');
    expect(f.go('b')).toBe(true);
    expect(f.go('c')).toBe(true);
  });
  it('observe always records; edges are counted', () => {
    const f = new Fsm<S>('a', { a: [] });
    f.observe('c');
    f.observe('a');
    f.observe('c');
    expect(f.observedEdges()).toEqual({ 'a>c': 2, 'c>a': 1 });
  });
  it('unsubscribe works', () => {
    const f = new Fsm<S>('a');
    let n = 0;
    const off = f.onChange(() => n++);
    f.go('b');
    off();
    f.go('c');
    expect(n).toBe(1);
  });
});
