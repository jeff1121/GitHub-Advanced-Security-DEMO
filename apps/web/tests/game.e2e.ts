import { test, expect } from '@playwright/test';

test('three independent browsers create, join, chat, reconnect and finish a game', async ({ browser }, testInfo) => {
  const origin = process.env.DEMO_URL || 'http://localhost:8080';
  const contexts = await Promise.all([browser.newContext(), browser.newContext(), browser.newContext({ viewport: { width: 390, height: 844 } })]);
  const pages = await Promise.all(contexts.map((context) => context.newPage()));
  const [host, guest, mobile] = pages;
  const crashes: string[] = [];
  for (const page of pages) page.on('pageerror', (error) => crashes.push(error.message));
  try {
    await host.goto(`${origin}/create`);
    await host.getByLabel('您的暱稱').fill('Browser Host');
    await host.getByLabel('房間名稱').fill('Browser verification');
    await host.getByRole('button', { name: '立即開房' }).click();
    await expect(host.getByTestId('room-code')).toHaveText(/^[A-Z0-9]{6}$/);
    const code = await host.getByTestId('room-code').innerText();
    for (let index = 1; index < pages.length; index++) {
      await pages[index].goto(`${origin}/join?code=${code}`);
      await pages[index].getByLabel('您的暱稱').fill(`Browser Guest ${index}`);
      await pages[index].getByRole('button', { name: '進入房間' }).click();
      await expect(pages[index].getByTestId('room-code')).toHaveText(code);
      await expect(pages[index].getByRole('status')).toContainText('已連線');
      await expect(pages[index].getByRole('button', { name: '開始賓果遊戲' })).toHaveCount(0);
    }
    await expect(host.getByRole('heading', { name: '玩家（3）' })).toBeVisible();
    const beforeReload = await guest.locator('button[aria-label^="標記 "]').allTextContents();
    await guest.reload();
    await expect(guest.getByRole('status')).toContainText('已連線');
    await expect(guest.locator('button[aria-label^="標記 "]')).toHaveCount(24);
    expect(await guest.locator('button[aria-label^="標記 "]').allTextContents()).toEqual(beforeReload);
    const text = '<script>alert(1)</script>';
    await guest.getByPlaceholder('發送訊息給同房玩家...').fill(text);
    await guest.getByPlaceholder('發送訊息給同房玩家...').press('Enter');
    await expect(host.getByText(text, { exact: true })).toBeVisible();
    await host.getByText('分享房間 QR Code（本地環境）', { exact: true }).click();
    await expect(host.getByAltText(`加入 ${code} 房間的 QR Code`)).toBeVisible();
    await host.getByRole('button', { name: '開始賓果遊戲' }).click();
    for (let iteration = 0; iteration < 75; iteration++) {
      if (await host.getByRole('button', { name: '喊 BINGO！' }).isEnabled()) break;
      await host.getByRole('button', { name: '手動搖號' }).click();
      const enabled = host.locator('button[aria-label^="標記 "]:not([disabled])');
      while (await enabled.count()) {
        const number = await enabled.first().getAttribute('aria-label');
        await enabled.first().click();
        await expect(host.getByRole('button', { name: number!, exact: true })).toBeDisabled();
      }
    }
    await expect(host.getByRole('button', { name: '喊 BINGO！' })).toBeEnabled();
    await host.getByRole('button', { name: '喊 BINGO！' }).click();
    for (const page of pages) await expect(page.getByTestId('game-result')).toContainText('Browser Host');
    expect(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await mobile.evaluate(() => window.scrollTo(0, 0));
    await mobile.screenshot({ path: testInfo.outputPath('mobile-result.png'), fullPage: true });
    await host.getByRole('link', { name: '查看戰報' }).click();
    await expect(host.getByAltText('賽後戰報')).toBeVisible();
    expect(crashes).toEqual([]);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});
