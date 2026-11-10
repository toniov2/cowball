import type { Page } from '@playwright/test';

export async function openGame(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort()); // no network: the game must not need the CDN
  await page.goto('/index.html');
  await page.waitForFunction(() => 'CowballTest' in window && 'Cowball2' in window, null, {
    timeout: 15_000,
  });
  return errors;
}
