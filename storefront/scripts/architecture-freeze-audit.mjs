import { spawnSync } from 'node:child_process';

const CERTIFIED_V4_SHA = '7ca181685d8c06d3ebcde703fbbe43526475f35a';
const protectedPaths = [
  'storefront/design-system/tokens.json',
  'storefront/src/styles/theme.generated.css',
  'storefront/src/design-system/tokens.generated.ts',
  'storefront/src/design-system/index.ts',
  'storefront/src/design-system/primitives.tsx',
  'storefront/src/app/globals.css',
  'storefront/src/design-system/route-contract.ts',
  'storefront/src/design-system/visual-exceptions.ts',
  'storefront/scripts/architecture-audit.mjs',
  'storefront/scripts/design-system-audit.mjs',
  'storefront/scripts/css-ownership-audit.mjs',
  'storefront/src/components/layout/MainLayout.tsx',
];

const result = spawnSync(
  'git',
  ['diff', '--exit-code', '--name-only', CERTIFIED_V4_SHA, '--', ...protectedPaths],
  { cwd: new URL('../..', import.meta.url), encoding: 'utf8' }
);

if (result.error) {
  console.error(`Architecture freeze audit could not run: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error('BLOCKED_FOR_ARCHITECTURE_REVIEW');
  console.error(result.stdout || result.stderr || 'Protected V4 files changed.');
  process.exit(1);
}

console.log(`Architecture freeze audit passed against ${CERTIFIED_V4_SHA}.`);
console.log(`${protectedPaths.length} protected architecture paths are unchanged.`);
