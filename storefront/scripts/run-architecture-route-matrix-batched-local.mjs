import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { readRouteContracts } from './read-route-contracts.mjs';

const cwd = process.cwd();
const nodeCommand = process.execPath;
const batchSize = Number.parseInt(process.env.ROUTE_BATCH_SIZE || '8', 10);
const outputRoot = path.join(cwd, '.verification', 'architecture-v4');
const resultsPath = path.join(outputRoot, 'route-matrix.json');
const tempDir = path.join(outputRoot, 'batches');
const sharedEnv = {
  ...process.env,
  DESIGN_SYSTEM_LAB: 'true',
  NEXT_PUBLIC_DESIGN_SYSTEM_LAB: 'true',
  NEXT_PUBLIC_E2E: 'true',
  INTERNAL_API_URL: 'http://127.0.0.1:4000',
  NEXT_PUBLIC_API_URL: 'http://127.0.0.1:4000',
  BASE_URL: 'http://127.0.0.1:3000',
};

const viewports = ['mobile-375', 'tablet-768', 'tablet-1024', 'desktop-1440'];
let shuttingDown = false;
const children = [];

function spawnChild(args, label, extraEnv = {}, stdio = 'inherit') {
  const child = spawn(nodeCommand, args, {
    cwd,
    env: { ...sharedEnv, ...extraEnv },
    stdio,
  });
  child.on('error', (error) => {
    console.error(`[${label}]`, error);
  });
  children.push(child);
  return child;
}

async function runChild(args, label, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnChild(args, label, extraEnv);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} exited with code ${code ?? 'null'}`));
    });
  });
}

async function waitForHealth(url, label, timeoutMs = 240000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`${label} did not become healthy within ${timeoutMs}ms`);
}

function terminateChildren(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }

  const forceKillTimer = setTimeout(() => {
    for (const child of children) {
      if (child.exitCode === null) child.kill('SIGKILL');
    }
    process.exit(exitCode);
  }, 5000);

  Promise.all(
    children.map(
      (child) =>
        new Promise((resolve) => {
          if (child.exitCode !== null) {
            resolve();
            return;
          }
          child.once('exit', () => resolve());
        })
    )
  ).finally(() => {
    clearTimeout(forceKillTimer);
    process.exit(exitCode);
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => terminateChildren(1));
}

function loadBatchReport(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

try {
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.mkdirSync(tempDir, { recursive: true });

  const routes = readRouteContracts().filter((route) => route.pattern !== '/__design-system');
  const totalRoutes = routes.length;
  const batches = [];
  for (let start = 0; start < totalRoutes; start += batchSize) {
    batches.push({ start, limit: Math.min(batchSize, totalRoutes - start) });
  }

  const mockApi = spawnChild(['scripts/e2e-mock-api.mjs'], 'mock-api');
  mockApi.once('exit', (code) => {
    if (!shuttingDown && code !== 0) terminateChildren(code ?? 1);
  });
  await waitForHealth('http://127.0.0.1:4000/health', 'mock API', 30000);

  const storefront = spawnChild(['scripts/playwright-storefront-server.mjs'], 'storefront');
  storefront.once('exit', (code) => {
    if (!shuttingDown && code !== 0) terminateChildren(code ?? 1);
  });
  await waitForHealth('http://127.0.0.1:3000/health', 'storefront server');

  const aggregated = new Map();

  for (const viewport of viewports) {
    for (const batch of batches) {
      const batchFile = path.join(tempDir, `${viewport}-${batch.start}.json`);
      await runChild(['scripts/architecture-route-matrix.mjs'], `route-matrix-${viewport}-${batch.start}`, {
        VIEWPORT_FILTER: viewport,
        ROUTE_START: String(batch.start),
        ROUTE_LIMIT: String(batch.limit),
      });
      const batchReport = loadBatchReport(resultsPath);
      for (const entry of batchReport.report) {
        const key = `${entry.pattern}::${entry.testFixture}`;
        const existing = aggregated.get(key);
        if (existing) {
          existing.results.push(...entry.results);
        } else {
          aggregated.set(key, {
            ...entry,
            results: [...entry.results],
          });
        }
      }
      fs.writeFileSync(batchFile, JSON.stringify(batchReport, null, 2));
    }
  }

  const report = [...aggregated.values()];
  const totals = report.flatMap((entry) => entry.results);
  const failures = totals.filter((entry) => !entry.ok);
  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: sharedEnv.BASE_URL,
    routes: report.length,
    viewports,
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
    terminateChildren(1);
  } else {
    console.log(
      `Architecture route matrix passed: ${report.length} routes across ${viewports.length} viewports.`
    );
    terminateChildren(0);
  }
} catch (error) {
  console.error(error);
  terminateChildren(1);
}
