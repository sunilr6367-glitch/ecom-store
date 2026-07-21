import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const manifestPath = path.resolve('.next/server/app-paths-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Filter out dynamic routes and api routes
const routes = Object.keys(manifest)
  .filter(r => !r.includes('[') && !r.includes('route') && r !== '/_global-error/page' && r !== '/_not-found/page')
  .map(r => r.replace('/page', ''));

const BASE_URL = process.env.BASE_URL || 'https://odhvica.com';

async function runAudit() {
  console.log(`Starting Live UI Audit on ${BASE_URL} for ${routes.length} static routes...`);
  const browser = await chromium.launch({ headless: true });
  
  const results = [];
  
  for (const route of routes) {
    const url = `${BASE_URL}${route === '/' ? '' : route}`;
    console.log(`Scanning: ${url}`);
    
    const pageResult = { route, url, mobile: {}, desktop: {} };
    
    // Check Mobile
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobileContext.newPage();
    let mobileErrors = [];
    mobilePage.on('pageerror', error => mobileErrors.push(error.message));
    
    try {
      const response = await mobilePage.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      if (!response.ok()) {
        pageResult.mobile.status = response.status();
      } else {
        const hasHorizontalScroll = await mobilePage.evaluate(() => document.body.scrollWidth > window.innerWidth);
        pageResult.mobile = { hasHorizontalScroll, errors: mobileErrors };
      }
    } catch (e) {
      pageResult.mobile.error = e.message;
    }
    await mobileContext.close();

    // Check Desktop
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const desktopPage = await desktopContext.newPage();
    let desktopErrors = [];
    desktopPage.on('pageerror', error => desktopErrors.push(error.message));
    
    try {
      const response = await desktopPage.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      if (!response.ok()) {
        pageResult.desktop.status = response.status();
      } else {
        const hasHorizontalScroll = await desktopPage.evaluate(() => document.body.scrollWidth > window.innerWidth);
        pageResult.desktop = { hasHorizontalScroll, errors: desktopErrors };
      }
    } catch (e) {
      pageResult.desktop.error = e.message;
    }
    await desktopContext.close();
    
    results.push(pageResult);
  }
  
  await browser.close();
  
  fs.writeFileSync('audit_results.json', JSON.stringify(results, null, 2));
  console.log('Audit complete! Results saved to audit_results.json');
}

runAudit().catch(console.error);
