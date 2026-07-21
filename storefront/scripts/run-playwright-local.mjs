import { spawn } from 'node:child_process';

const cwd = process.cwd();
const isWindows = process.platform === 'win32';
const nodeCommand = process.execPath;
const npxCommand = isWindows ? 'npx.cmd' : 'npx';
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

function spawnChild(command, args, label, options = {}) {
  const child = spawn(command, args, {
    cwd,
    env: sharedEnv,
    stdio: 'inherit',
    shell: options.shell ?? false,
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
    if (child.exitCode === null) {
      child.kill('SIGTERM');
    }
  }

  const deadline = setTimeout(() => {
    for (const child of children) {
      if (child.exitCode === null) {
        child.kill('SIGKILL');
      }
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
    clearTimeout(deadline);
    process.exit(exitCode);
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => terminateChildren(1));
}

try {
  const mockApi = spawnChild(nodeCommand, ['scripts/e2e-mock-api.mjs'], 'mock-api');
  mockApi.once('exit', (code) => {
    if (!shuttingDown && code !== 0) terminateChildren(code ?? 1);
  });
  await waitForHealth('http://127.0.0.1:4000/health', 'mock API', 30000);

  const storefront = spawnChild(
    nodeCommand,
    ['scripts/playwright-storefront-server.mjs'],
    'storefront'
  );
  storefront.once('exit', (code) => {
    if (!shuttingDown && code !== 0) terminateChildren(code ?? 1);
  });
  await waitForHealth('http://127.0.0.1:3000/health', 'storefront server');

  const playwrightArgs = ['playwright', 'test', ...process.argv.slice(2)];
  const runner = spawnChild(npxCommand, playwrightArgs, 'playwright', {
    shell: isWindows,
  });

  runner.once('exit', (code) => terminateChildren(code ?? 0));
} catch (error) {
  console.error(error);
  terminateChildren(1);
}
