import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiBase = process.env.API_URL || 'http://localhost:4000';

async function assertServerIsReachable() {
  try {
    const response = await fetch(`${apiBase}/health`);
    if (!response.ok) {
      throw new Error(`Health check returned ${response.status}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `Integration tests require a running backend at ${apiBase}. ${message}`
    );
    process.exit(1);
  }
}

async function main() {
  await assertServerIsReachable();

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const vitestEntrypoint = path.resolve(
    currentDir,
    '../node_modules/vitest/vitest.mjs'
  );

  const result = spawnSync(
    process.execPath,
    [vitestEntrypoint, 'run', 'tests/api.test.ts'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        RUN_INTEGRATION_TESTS: 'true',
      },
    }
  );

  if (typeof result.status === 'number') {
    process.exit(result.status);
  }

  console.error(result.error ?? 'Integration tests failed to start.');
  process.exit(1);
}

main();
