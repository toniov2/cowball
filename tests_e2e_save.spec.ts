import { expect, test } from '@playwright/test';
import { openGame } from './helpers';

test('save is mirrored to IndexedDB and restored after localStorage is wiped', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => {
    const w = window as unknown as Record<string, any>;
    w.CowballTest.settings().wins = 7;
    w.CowballTest.save();
  });
  await page.waitForFunction(
    () =>
      (window as unknown as { Cowball2: { save: { status: { mirrored: number } } } }).Cowball2.save.status
        .mirrored > 0,
    null,
    { timeout: 5000 },
  );
  await page.evaluate(() => localStorage.removeItem('cowball'));
  await page.reload();
  await page.waitForFunction(() => 'CowballTest' in window && 'Cowball2' in window);
  await page.waitForFunction(() => !!localStorage.getItem('cowball'), null, { timeout: 8000 });
  const wins = await page.evaluate(
    () =>
      (window as unknown as { CowballTest: { settings(): { wins: number } } }).CowballTest.settings().wins,
  );
  expect(wins).toBe(7);
});
