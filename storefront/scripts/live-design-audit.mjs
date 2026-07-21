import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Target domain for the live audit
const TARGET_DOMAIN = 'https://odhvica.com';
const SITEMAP_URL = `${TARGET_DOMAIN}/sitemap.xml`;

const SCREENSHOT_DIR = path.resolve('.verification/live-audit/screenshots');
const RESULTS_FILE = path.resolve('.verification/live-audit/results.json');
const REPORT_FILE = path.resolve('.verification/live-audit/report.md');

// Create directories
fs.mkdirSync(path.join(SCREENSHOT_DIR, 'desktop'), { recursive: true });
fs.mkdirSync(path.join(SCREENSHOT_DIR, 'mobile'), { recursive: true });

// Custom URL slug generator for filenames
function getFilenameSlug(urlStr) {
  try {
    const url = new URL(urlStr);
    let pathname = url.pathname.replace(/^\/|\/$/g, '');
    if (!pathname) return 'homepage';
    return pathname.replace(/\//g, '_');
  } catch {
    return 'unknown';
  }
}

async function fetchSitemapUrls() {
  console.log(`Fetching sitemap from ${SITEMAP_URL}...`);
  try {
    const response = await fetch(SITEMAP_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
    }
    const text = await response.text();
    const urls = [];
    const locRegex = /<loc>(https?:\/\/[^<]+)<\/loc>/g;
    let match;
    while ((match = locRegex.exec(text)) !== null) {
      let url = match[1].trim();
      // Force TARGET_DOMAIN
      url = url.replace(/^https?:\/\/[^\/]+/, TARGET_DOMAIN);
      urls.push(url);
    }
    return urls;
  } catch (err) {
    console.error('Error fetching sitemap, falling back to static list:', err.message);
    return [];
  }
}

async function main() {
  const sitemapUrls = await fetchSitemapUrls();
  console.log(`Discovered ${sitemapUrls.length} URLs from sitemap.`);

  // Additional key routes to audit that may not be in sitemap.xml
  const extraRoutes = [
    '/cart',
    '/checkout',
    '/login',
    '/register',
    '/account',
    '/wishlist',
    '/search?q=dress',
    '/search?q=cotton',
    '/forgot-password',
    '/reset-password',
  ].map(route => `${TARGET_DOMAIN}${route}`);

  // Combine and deduplicate
  const allUrls = Array.from(new Set([...sitemapUrls, ...extraRoutes]));
  console.log(`Total URLs to audit (including extra interactive routes): ${allUrls.length}`);

  // Limit to at most 60 to prevent infinite runs, but audit all if it's around 57
  const urlsToAudit = allUrls.slice(0, 65);
  console.log(`Starting audit on ${urlsToAudit.length} pages...`);

  // Launch browser
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    console.log('Failed to launch from playwright directly, trying @playwright/test chromium...');
    // Fallback import
    const playwrightTest = await import('@playwright/test');
    browser = await playwrightTest.chromium.launch({ headless: true });
  }

  const results = [];

  for (let i = 0; i < urlsToAudit.length; i++) {
    const url = urlsToAudit[i];
    const slug = getFilenameSlug(url);
    console.log(`\n[${i + 1}/${urlsToAudit.length}] Auditing: ${url} (slug: ${slug})`);

    const result = {
      index: i + 1,
      url,
      slug,
      desktop: { success: false, errors: [], consoleMsgs: [], hasOverflow: false, screenshot: '' },
      mobile: { success: false, errors: [], consoleMsgs: [], hasOverflow: false, screenshot: '' },
    };

    // 1. DESKTOP AUDIT (1440x900)
    try {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AuditAgent/1.0',
      });
      const page = await context.newPage();

      // Listen for page errors and console errors
      page.on('pageerror', (err) => {
        result.desktop.errors.push(err.message);
      });
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          result.desktop.consoleMsgs.push(msg.text());
        }
      });

      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000); // Allow lazy loads/animations to complete

      if (response && response.ok()) {
        result.desktop.success = true;
        result.desktop.status = response.status();

        // Check for horizontal overflow/scroll
        const overflowResult = await page.evaluate(() => {
          const docWidth = document.documentElement.scrollWidth;
          const bodyWidth = document.body.scrollWidth;
          const winWidth = window.innerWidth;
          return {
            docWidth,
            bodyWidth,
            winWidth,
            hasOverflow: docWidth > winWidth + 2 || bodyWidth > winWidth + 2,
          };
        });

        result.desktop.hasOverflow = overflowResult.hasOverflow;
        result.desktop.overflowData = overflowResult;

        // Take screenshot
        const screenshotName = `${slug}_desktop.png`;
        const screenshotPath = path.join(SCREENSHOT_DIR, 'desktop', screenshotName);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.desktop.screenshot = `screenshots/desktop/${screenshotName}`;
      } else {
        result.desktop.status = response ? response.status() : 'No response';
      }
      await context.close();
    } catch (err) {
      result.desktop.errors.push(`Navigation/Audit failed: ${err.message}`);
    }

    // 2. MOBILE AUDIT (390x844 - iPhone 12/13/14 style)
    try {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1 AuditAgent/1.0',
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();

      // Listen for page errors and console errors
      page.on('pageerror', (err) => {
        result.mobile.errors.push(err.message);
      });
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          result.mobile.consoleMsgs.push(msg.text());
        }
      });

      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000); // Allow lazy loads/animations to complete

      if (response && response.ok()) {
        result.mobile.success = true;
        result.mobile.status = response.status();

        // Check for horizontal overflow/scroll
        const overflowResult = await page.evaluate(() => {
          const docWidth = document.documentElement.scrollWidth;
          const bodyWidth = document.body.scrollWidth;
          const winWidth = window.innerWidth;
          return {
            docWidth,
            bodyWidth,
            winWidth,
            hasOverflow: docWidth > winWidth + 2 || bodyWidth > winWidth + 2,
          };
        });

        result.mobile.hasOverflow = overflowResult.hasOverflow;
        result.mobile.overflowData = overflowResult;

        // Take screenshot
        const screenshotName = `${slug}_mobile.png`;
        const screenshotPath = path.join(SCREENSHOT_DIR, 'mobile', screenshotName);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.mobile.screenshot = `screenshots/mobile/${screenshotName}`;
      } else {
        result.mobile.status = response ? response.status() : 'No response';
      }
      await context.close();
    } catch (err) {
      result.mobile.errors.push(`Navigation/Audit failed: ${err.message}`);
    }

    results.push(result);
    // Write partial results in case of crash
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  }

  await browser.close();
  console.log(`\nAudit completed! Checked ${results.length} pages.`);

  // Generate Report
  generateMarkdownReport(results);
}

function generateMarkdownReport(results) {
  let md = `# Live Design and Layout Audit Report (odhvica.com)

**Date**: ${new Date().toLocaleString()}  
**Target URL**: [odhvica.com](https://odhvica.com)  
**Total Pages Audited**: ${results.length}  

---

## Executive Summary

| Device | Total Checked | Successful Loads | Layout Breaks (Horizontal Overflow) | JS Console Errors |
|--------|---------------|------------------|-------------------------------------|-------------------|
| **Desktop** | ${results.length} | ${results.filter(r => r.desktop.success).length} | ${results.filter(r => r.desktop.hasOverflow).length} | ${results.filter(r => r.desktop.consoleMsgs.length > 0).length} |
| **Mobile**  | ${results.length} | ${results.filter(r => r.mobile.success).length} | ${results.filter(r => r.mobile.hasOverflow).length} | ${results.filter(r => r.mobile.consoleMsgs.length > 0).length} |

---

## Key Findings

### 🚨 Responsive Layout Breaks (Mobile Horizontal Overflow)
Horizontal overflow causes a page to scroll sideways on mobile screens, which destroys the user experience. The following pages had mobile horizontal scroll:
${
  results.filter(r => r.mobile.hasOverflow).length === 0
    ? '*None! Excellent job on mobile responsiveness.*'
    : results.filter(r => r.mobile.hasOverflow).map(r => `- [${r.url}](${r.url}) (Widths: doc=${r.mobile.overflowData.docWidth}px, body=${r.mobile.overflowData.bodyWidth}px vs viewport=${r.mobile.overflowData.winWidth}px)`).join('\n')
}

### 🐞 Page & Console Errors
The following pages encountered runtime JS exceptions or console errors:
${
  results.filter(r => r.desktop.errors.length > 0 || r.mobile.errors.length > 0 || r.desktop.consoleMsgs.length > 0 || r.mobile.consoleMsgs.length > 0).length === 0
    ? '*None! The pages load cleanly without console/runtime errors.*'
    : results.filter(r => r.desktop.errors.length > 0 || r.mobile.errors.length > 0 || r.desktop.consoleMsgs.length > 0 || r.mobile.consoleMsgs.length > 0).map(r => {
        let entry = `- **[${r.url}](${r.url})**\n`;
        if (r.desktop.errors.length > 0) entry += `  - Desktop Errors: ${r.desktop.errors.join(', ')}\n`;
        if (r.mobile.errors.length > 0) entry += `  - Mobile Errors: ${r.mobile.errors.join(', ')}\n`;
        if (r.desktop.consoleMsgs.length > 0) entry += `  - Desktop Console Errors: \`${r.desktop.consoleMsgs.slice(0, 3).join('; ')}\`\n`;
        if (r.mobile.consoleMsgs.length > 0) entry += `  - Mobile Console Errors: \`${r.mobile.consoleMsgs.slice(0, 3).join('; ')}\`\n`;
        return entry;
      }).join('\n')
}

---

## Detailed Page Audit Logs

| # | Page URL | Desktop Status | Mobile Status | Desktop Overflow | Mobile Overflow | Screenshot Links |
|---|---|---|---|---|---|---|
${results.map(r => {
  const desktopStatus = r.desktop.success ? `✅ ${r.desktop.status}` : `❌ Failed`;
  const mobileStatus = r.mobile.success ? `✅ ${r.mobile.status}` : `❌ Failed`;
  const desktopOverflow = r.desktop.hasOverflow ? '🚨 Yes' : '✅ No';
  const mobileOverflow = r.mobile.hasOverflow ? '🚨 Yes' : '✅ No';
  const screenshotLinks = `[Desktop](file://${path.join(SCREENSHOT_DIR, 'desktop', `${r.slug}_desktop.png`).replace(/\\/g, '/')}) / [Mobile](file://${path.join(SCREENSHOT_DIR, 'mobile', `${r.slug}_mobile.png`).replace(/\\/g, '/')})`;
  return `| ${r.index} | [${r.slug}](${r.url}) | ${desktopStatus} | ${mobileStatus} | ${desktopOverflow} | ${mobileOverflow} | ${screenshotLinks} |`;
}).join('\n')}

---
*Report generated automatically by the Antigravity Live Audit Tool.*
`;

  fs.writeFileSync(REPORT_FILE, md);
  console.log(`Markdown report saved to ${REPORT_FILE}`);
}

main().catch(console.error);
