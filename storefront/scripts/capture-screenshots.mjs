import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const dir = path.join(process.cwd(), '.verification');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log('Waiting for dev server...');
  let retries = 10;
  while (retries > 0) {
    try {
      const response = await page.goto('http://localhost:3000/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      if (response && response.ok()) break;
    } catch {
      console.log('Server not ready, retrying...');
      await new Promise(r => setTimeout(r, 3000));
      retries--;
    }
  }

  console.log('Capturing Homepage...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(dir, 'homepage.png'), fullPage: true });

  console.log('Capturing Collections...');
  await page.goto('http://localhost:3000/collections', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(dir, 'collections.png'), fullPage: true });

  console.log('Capturing Product Page...');
  await page.evaluate(() => {
    const productLink = document.querySelector('a[href^="/products/"]');
    if (productLink) productLink.click();
  });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(dir, 'product.png'), fullPage: true });

  console.log('Capturing Cart Drawer...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => 
      b.getAttribute('aria-label')?.toLowerCase().includes('cart') ||
      b.getAttribute('aria-label')?.toLowerCase().includes('bag') ||
      b.querySelector('svg.lucide-shopping-bag') ||
      b.querySelector('.lucide-shopping-bag')
    );
    if (btn) btn.click();
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(dir, 'cart-drawer.png') });

  await browser.close();
  console.log('Done!');
})();
