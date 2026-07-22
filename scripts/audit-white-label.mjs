import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const allowedExtensions = new Set([
  '.css', '.js', '.json', '.md', '.mjs', '.sql', '.ts', '.tsx', '.yml', '.yaml',
]);
const excluded = [
  /^\.git\//,
  /(^|\/)node_modules\//,
  /(^|\/)\.next\//,
  /(^|\/)dist\//,
  /^backend\/src\/db\/migrations\//,
  /^backend\/drizzle\//,
  /package-lock\.json$/,
  /^scripts\/audit-white-label\.mjs$/,
];
const forbidden = [
  { label: 'legacy brand name', pattern: /odhvica|odhivca|kanthaprints/i },
  { label: 'legacy production domain', pattern: /(?:api\.|admin\.)?odhvica\.com/i },
];

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  cwd: root,
  encoding: 'utf8',
})
  .split(/\r?\n/)
  .filter(Boolean)
  .map((path) => path.replaceAll('\\', '/'))
  .filter((path) => allowedExtensions.has(extname(path).toLowerCase()))
  .filter((path) => !excluded.some((pattern) => pattern.test(path)));

const failures = [];
for (const path of files) {
  const absolutePath = resolve(root, path);
  if (!existsSync(absolutePath)) continue;
  const lines = readFileSync(absolutePath, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    forbidden.forEach(({ label, pattern }) => {
      if (pattern.test(line)) failures.push(`${relative(root, absolutePath)}:${index + 1} ${label}`);
    });
  });
}

if (failures.length > 0) {
  console.error('White-label audit failed:\n' + failures.join('\n'));
  process.exit(1);
}

console.log(`White-label audit passed across ${files.length} tracked source/config files.`);
