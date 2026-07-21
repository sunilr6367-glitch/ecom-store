import { spawn } from 'node:child_process';

const cwd = process.cwd();
const nodeCommand = process.execPath;
const sharedEnv = {
  ...process.env,
  DESIGN_SYSTEM_LAB: 'true',
  NEXT_PUBLIC_DESIGN_SYSTEM_LAB: 'true',
  NEXT_PUBLIC_E2E: 'true',
  INTERNAL_API_URL: 'http://127.0.0.1:4000',
  NEXT_PUBLIC_API_URL: 'http://127.0.0.1:4000',
  BASE_URL: 'http://127.0.0.1:3000',
};

let shuttingDown = false;
const children = [];

function spawnChild(args, label) {
  const child = spawn(nodeCommand, args, {
    cwd,
    env: sharedEnv,
    stdio: 'inherit',
  });
  child.on('error', (error) => {
    console.error(`[${label}]`, error);
  });
  children.push(child);
  return child;
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

try {
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

  const matrix = spawnChild(['scripts/architecture-route-matrix.mjs'], 'route-matrix');
  matrix.once('exit', (code) => terminateChildren(code ?? 0));
} catch (error) {
  console.error(error);
  terminateChildren(1);
}
