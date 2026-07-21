import { expect, test } from '@playwright/test';

test.describe('Architecture V4 component lab', () => {
  test('renders certified primitives without overflow or console failures', async ({ page }, testInfo) => {
    const failures: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') failures.push(`console: ${message.text()}`);
    });
    page.on('response', (response) => {
      if (response.status() >= 500) failures.push(`network: ${response.status()} ${response.url()}`);
    });

    await page.goto('/__design-system');
    await expect(page.getByRole('heading', { name: 'Odhvica component lab' })).toBeVisible();
    await expect(page.locator('[data-page-shell]').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    await page.getByRole('button', { name: 'Open modal' }).scrollIntoViewIfNeeded();
    await expect
      .poll(async () => {
        await page.getByRole('button', { name: 'Open modal' }).click();
        return page.getByRole('dialog', { name: 'Modal state' }).count();
      })
      .toBe(1);
    await expect(page.getByRole('dialog', { name: 'Modal state' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Modal state' })).toBeHidden();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.screenshot({ path: testInfo.outputPath('component-lab.png'), fullPage: true });
    expect(failures).toEqual([]);
  });

  test('keeps controls at least 44 by 44 pixels', async ({ page }) => {
    await page.goto('/__design-system');
    const undersized = await page.locator('[data-page-shell] button, [data-page-shell] a[href], [data-page-shell] input, [data-page-shell] select, [data-page-shell] textarea').evaluateAll((elements) =>
      elements.filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        return rect.width < 44 || rect.height < 44;
      }).map((element) => `${element.tagName}:${element.getAttribute('aria-label') || element.textContent?.trim() || element.getAttribute('name')}`),
    );
    expect(undersized).toEqual([]);
  });
});
