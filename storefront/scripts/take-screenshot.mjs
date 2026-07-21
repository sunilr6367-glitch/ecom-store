import { chromium } from '@playwright/test';

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 2500 }
  });
  const page = await context.newPage();
  
  console.log('Navigating to live site (https://odhvica.com)...');
  try {
    await page.goto('https://odhvica.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    console.log('Navigation took too long, proceeding anyway...', e.message);
  }
  
  // Wait a bit extra for images and animations to fully load
  await page.waitForTimeout(5000); 
  
  console.log('Taking full page screenshot...');
  try {
    await page.screenshot({ path: 'live-homepage-screenshot.png', fullPage: true, timeout: 60000 });
  } catch(e) {
    console.log('Screenshot failed:', e.message);
  }
  
  await browser.close();
  console.log('Screenshot saved to live-homepage-screenshot.png');
})();
