import { expect, test } from '@playwright/test';
import { openGame } from './helpers';

test('loads without JS errors, with real Three.js and the v2 scaffold', async ({ page }) => {
  const errors = await openGame(page);
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
  const info = await page.evaluate(() => {
    const w = window as unknown as Record<string, any>;
    return {
      three: String(w.THREE?.REVISION),
      hasRenderer: !!w.CowballV2Hook?.renderer,
      v2: w.Cowball2.version,
      state: w.CowballTest.state,
    };
  });
  expect(info.three).toBe('128');
  expect(info.hasRenderer).toBe(true);
  expect(info.v2).toBe('51.0');
  expect(info.state).toBe('menu');
});

test('FSM mirrors the legacy setState', async ({ page }) => {
  await openGame(page);
  const r = await page.evaluate(() => {
    const w = window as unknown as Record<string, any>;
    w.CowballTest.setState('paused');
    const a = w.Cowball2.fsm.state;
    w.CowballTest.setState('menu');
    return { a, b: w.Cowball2.fsm.state, edges: w.Cowball2.fsm.observedEdges() };
  });
  expect(r.a).toBe('paused');
  expect(r.b).toBe('menu');
  expect(r.edges['menu>paused']).toBe(1);
});

test('profiler measures frames; renderer info is readable', async ({ page }) => {
  await openGame(page);
  await page.waitForTimeout(2500);
  const s = await page.evaluate(() =>
    (
      window as unknown as { Cowball2: { perf: { snapshot(): Record<string, number | null> } } }
    ).Cowball2.perf.snapshot(),
  );
  expect(s.frames).toBeGreaterThan(2); // software GL in headless Chromium renders only a few frames per second
  expect(s.drawCalls).not.toBeNull();
  console.log('PROFILE (software GL, not a real GPU):', JSON.stringify(s));
});
