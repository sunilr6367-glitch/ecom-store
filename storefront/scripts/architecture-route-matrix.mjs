import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { readRouteContracts } from './read-route-contracts.mjs';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const outputRoot = path.join(process.cwd(), '.verification', 'architecture-v4');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const resultsPath = path.join(outputRoot, 'route-matrix.json');
const routeFilter = process.env.ROUTE_FILTER || '';
const viewportFilter = process.env.VIEWPORT_FILTER || '';
const routeStart = Number.parseInt(process.env.ROUTE_START || '0', 10);
const routeLimit = Number.parseInt(process.env.ROUTE_LIMIT || '0', 10);

const allViewports = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
];
const viewports = viewportFilter
  ? allViewports.filter((viewport) => viewport.name === viewportFilter)
  : allViewports;

function sanitizeSlug(value) {
  return value
    .replace(/^\/+/, '')
    .replace(/[/?=&[\]]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'home';
}

function routeHasExpectedChrome(pageInfo) {
  const { chromeMode, dom } = pageInfo;
  if (chromeMode === 'checkout') {
    return !dom.hasHeader && !dom.hasFooter && !dom.hasBottomNav;
  }
  if (chromeMode === 'wholesale') {
    return dom.hasHeader && dom.hasFooter;
  }
  return dom.hasMain;
}

function isBenignRequestFailure(entry) {
  return (
    entry.startsWith('net::ERR_ABORTED ') &&
    (entry.includes(`${baseUrl}/`) || entry.includes(`${baseUrl}/api/`))
  );
}

async function readPageState(page) {
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return {
        overflow: await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth
        ),
        dom: await page.evaluate(() => ({
          hasMain: Boolean(document.querySelector('#main-content')),
          hasHeader: Boolean(document.querySelector('header')),
          hasFooter: Boolean(document.querySelector('footer')),
          hasBottomNav: Boolean(
            document.querySelector('[aria-label="Bottom navigation"]')
          ),
          h1Count: document.querySelectorAll('main h1').length,
          bodyFont: getComputedStyle(document.body).fontFamily,
          firstHeadingFont:
            document.querySelector('main h1, main h2') instanceof HTMLElement
              ? getComputedStyle(document.querySelector('main h1, main h2')).fontFamily
              : null,
        })),
      };
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('Execution context was destroyed')) {
        throw error;
      }
      await page.waitForTimeout(500);
    }
  }

  throw lastError;
}

async function auditRoute(browser, route) {
  const routeSlug = sanitizeSlug(route.testFixture);
  const viewResults = [];

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const networkFailures = [];
    const httpErrors = [];
    const requestFailures = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    page.on('requestfailed', (request) => {
      requestFailures.push(
        `${request.failure()?.errorText || 'REQUEST_FAILED'} ${request.url()}`
      );
    });

    page.on('response', (response) => {
      const url = response.url();
      if (url.startsWith(baseUrl) && response.status() >= 400) {
        httpErrors.push(`${response.status()} ${url}`);
      }
      if (
        url.startsWith(baseUrl) &&
        (response.status() >= 500 ||
          (url.includes('/api/') && response.status() >= 400))
      ) {
        networkFailures.push(`${response.status()} ${url}`);
      }
    });

    const result = {
      viewport: viewport.name,
      fixture: route.testFixture,
      pageKind: route.pageKind,
      chromeMode: route.chromeMode,
      url: `${baseUrl}${route.testFixture}`,
      finalUrl: null,
      ok: false,
      screenshot: null,
      overflow: null,
      dom: null,
      consoleErrors,
      networkFailures,
      httpErrors,
      requestFailures,
      error: null,
    };

    try {
      const response = await page.goto(result.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForTimeout(1200);
      result.finalUrl = page.url();
      result.status = response?.status() ?? null;
      const viewportDir = path.join(screenshotRoot, viewport.name);
      fs.mkdirSync(viewportDir, { recursive: true });
      const screenshotPath = path.join(viewportDir, `${routeSlug}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshot = path.relative(outputRoot, screenshotPath).replaceAll('\\', '/');
      await page.waitForTimeout(300);

      const pageState = await readPageState(page);
      result.overflow = pageState.overflow;
      result.dom = pageState.dom;

      const hasExpectedChrome = routeHasExpectedChrome({ chromeMode: route.chromeMode, dom: result.dom });
      const hasSingleH1 = result.dom.h1Count <= 1;
      const hasNoOverflow = result.overflow <= 2;
      const hasNoErrors =
        result.consoleErrors.length === 0 &&
        result.networkFailures.length === 0 &&
        result.httpErrors.length === 0 &&
        result.requestFailures.filter((entry) => !isBenignRequestFailure(entry)).length === 0;

      result.ok =
        Boolean(response?.ok() || response?.status() === 307 || response?.status() === 308) &&
        hasExpectedChrome &&
        hasSingleH1 &&
        hasNoOverflow &&
        hasNoErrors;
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
    } finally {
      viewResults.push(result);
      await context.close();
    }
  }

  return {
    pattern: route.pattern,
    pageKind: route.pageKind,
    chromeMode: route.chromeMode,
    testFixture: route.testFixture,
    requiredVisualStates: route.requiredVisualStates,
    approvedExceptions: route.approvedExceptions,
    results: viewResults,
  };
}

async function main() {
  fs.mkdirSync(outputRoot, { recursive: true });
  const candidateRoutes = readRouteContracts().filter((route) => route.pattern !== '/__design-system');
  const exactRoutes = routeFilter
    ? candidateRoutes.filter(
        (route) => route.pattern === routeFilter || route.testFixture === routeFilter
      )
    : [];
  const filteredRoutes = (exactRoutes.length > 0 ? exactRoutes : candidateRoutes).filter(
    (route) =>
      !routeFilter ||
      exactRoutes.length > 0 ||
      route.pattern.includes(routeFilter) ||
      route.testFixture.includes(routeFilter)
  );
  const routes =
    routeLimit > 0
      ? filteredRoutes.slice(routeStart, routeStart + routeLimit)
      : filteredRoutes.slice(routeStart);

  if (viewports.length === 0) {
    throw new Error(`No viewport matched VIEWPORT_FILTER=${viewportFilter}`);
  }

  if (routes.length === 0) {
    throw new Error(`No route matched ROUTE_FILTER=${routeFilter}`);
  }

  const browser = await chromium.launch({ headless: true });
  const report = [];

  try {
    for (const route of routes) {
      report.push(await auditRoute(browser, route));
      fs.writeFileSync(resultsPath, JSON.stringify(report, null, 2));
    }
  } finally {
    await browser.close();
  }

  const totals = report.flatMap((entry) => entry.results);
  const failures = totals.filter((entry) => !entry.ok);
  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    routes: report.length,
    viewports: viewports.map((viewport) => viewport.name),
    totalChecks: totals.length,
    failedChecks: failures.length,
      failures: failures.slice(0, 20).map((entry) => ({
      fixture: entry.fixture,
      viewport: entry.viewport,
      error: entry.error,
      consoleErrors: entry.consoleErrors,
      networkFailures: entry.networkFailures,
      httpErrors: entry.httpErrors,
      requestFailures: entry.requestFailures,
      overflow: entry.overflow,
      dom: entry.dom,
    })),
    report,
  };

  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2));

  if (failures.length > 0) {
    console.error(`Architecture route matrix failed: ${failures.length} checks failed.`);
    process.exit(1);
  }

  console.log(
    `Architecture route matrix passed: ${report.length} routes across ${viewports.length} viewports.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
