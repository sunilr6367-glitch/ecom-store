import { expect, test } from '@playwright/test';

const publicAdminCopy =
  /publish|configure|add|upload|manage|create.+(?:in|from) (?:the )?admin/i;

test.describe('Storefront visual contract', () => {
  test('homepage exposes the primary shopping experience', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    try {
      const viewportWidth = testInfo.project.use?.viewport?.width ?? 1440;
      const isMobileViewport = viewportWidth < 768;
      await expect(page).toHaveTitle(/Store|Kantha/i);
      await expect(page.locator('main')).toBeVisible();
      if (isMobileViewport) {
        await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
      } else {
        await expect(page.locator('nav').first()).toBeVisible();
      }
      await expect(page.locator('footer').first()).toBeVisible();
      await expect(page.locator('body')).not.toContainText(publicAdminCopy);

      const hero = page.locator('main section').first();
      await expect(hero).toBeVisible();
      await expect(hero.getByRole('link').first()).toBeVisible();
    } catch (error) {
      console.log('--- TEST FAILED HTML DUMP ---');
      const html = await page.locator('body').innerHTML();
      console.log(html);
      console.log('--- END HTML DUMP ---');
      throw error;
    }
  });

  test('homepage renders the editorial commerce contract in order', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const sections = page.locator('[data-home-section]');
    await expect(sections).toHaveCount(13);
    await expect(sections.first()).toHaveAttribute('data-home-section', /2-hero/, {
      timeout: 10000,
    });
    expect(await sections.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-home-section'))
    )).toEqual([
      '2-hero',
      '1-circle-categories',
      '8-new-arrivals',
      '4-editorial-categories',
      '5-best-sellers',
      '13-collection-slider',
      '12-watch-shop',
      '6-collections',
      '10-craft-journey',
      '9-social',
      '3-trust-bar',
      '10-newsletter',
      '15-footer',
    ]);
  });

  test('homepage keeps best sellers out of campaign previews', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(
      page.locator('[data-home-section="5-best-sellers"] .product-card')
    ).toHaveCount(4);
    const bestSellerIds = await page
      .locator('[data-home-section="5-best-sellers"] article')
      .evaluateAll((nodes) =>
        nodes.map((node) =>
          node.querySelector('a[href^="/products/"]')?.getAttribute('href')?.split('/').pop()
        ).filter(Boolean)
      );
    const campaignIds = await page
      .locator('[data-campaign-product-id]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-campaign-product-id')));
    expect(campaignIds.filter((id) => bestSellerIds.includes(id || ''))).toEqual([]);
  });

  test('hero exposes four slides and accessible playback controls', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-home-section="2-hero"] article')).toHaveCount(4);
    await expect(page.getByRole('button', { name: 'Pause hero slideshow' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next hero slide' })).toBeVisible();
    await page.getByRole('button', { name: 'Pause hero slideshow' }).click();
    await expect(page.getByRole('button', { name: 'Play hero slideshow' })).toBeVisible();
  });

  test('category circles support arrow-key focus navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const row = page
      .locator('#main-content [data-keyboard-ready="true"]')
      .first();
    await expect(row).toBeVisible();
    const links = row.locator('.homepage-circle-link');
    await links.first().focus();
    await expect(links.first()).toBeFocused();
    await links.first().evaluate((node) => {
      node.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          bubbles: true,
          cancelable: true,
        })
      );
    });
    await expect(links.nth(1)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(links.first()).toBeFocused();
  });

  test('only the first hero image is eager loaded', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const heroImages = page.locator('[data-home-section="2-hero"] article img');
    await expect(heroImages).toHaveCount(4);
    await expect(heroImages.first()).toHaveAttribute('loading', 'eager');
    for (let index = 1; index < 4; index += 1) {
      await expect(heroImages.nth(index)).toHaveAttribute('loading', 'lazy');
    }
  });

  test('homepage does not overflow its viewport', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });

  test('homepage rails, typography, and inverse contrast preserve visual geometry', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const railSections = [
      '5-best-sellers',
      '8-new-arrivals',
      '12-watch-shop',
    ];
    for (const sectionName of railSections) {
      const rail = page.locator(`[data-home-section="${sectionName}"] .overflow-x-auto`).first();
      await expect(rail).toBeVisible();
      expect(await rail.evaluate((element) => getComputedStyle(element).display)).toBe('flex');
    }

    const bestSellerCards = page.locator('[data-home-section="5-best-sellers"] .product-card');
    await expect(bestSellerCards).toHaveCount(4);
    const cardPositions = await bestSellerCards.evaluateAll((cards) =>
      cards.map((card) => {
        const rect = card.getBoundingClientRect();
        return { x: Math.round(rect.x), y: Math.round(rect.y) };
      })
    );
    expect(new Set(cardPositions.map((position) => position.y)).size).toBe(1);
    expect(cardPositions[1].x).toBeGreaterThan(cardPositions[0].x);

    const typography = await page.evaluate(() => {
      const heroHeading = document.querySelector(
        '[data-home-section="2-hero"] article:first-of-type .font-display'
      );

      if (!(heroHeading instanceof Element)) {
        throw new Error('Hero visual heading element was not found.');
      }

      return {
        body: getComputedStyle(document.body).fontFamily,
        heading: getComputedStyle(heroHeading).fontFamily,
        heroColor: getComputedStyle(heroHeading).color,
      };
    });
    expect(typography.body).toMatch(/Cardo/i);
    expect(typography.heading).toMatch(/Amiri/i);
    expect(typography.heroColor).toBe('rgb(255, 255, 255)');
  });

  test('products, cart, and login routes remain usable', async ({ page }) => {
    for (const path of ['/products', '/cart', '/login']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#main-content')).toBeVisible();
    }
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test('categories navigation resolves to the active discovery index', async ({ page }) => {
    const response = await page.goto('/categories', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/collections$/);
  });

  test('legacy trending route resolves to reels', async ({ page }) => {
    await page.goto('/trending-now', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(page).toHaveURL(/\/reels$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
