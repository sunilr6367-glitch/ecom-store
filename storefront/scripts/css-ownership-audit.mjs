import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const storefrontRoot = path.resolve(scriptDir, '..');
const stylesRoot = path.join(storefrontRoot, 'src');
const baselinePath = path.join(scriptDir, 'css-ownership-baseline.json');
const classPattern = /\.([a-zA-Z_][\w-]*)/g;
const cssCommentPattern = /\/\*[\s\S]*?\*\//g;
const cssStringPattern = /(["'])(?:\\.|(?!\1)[^\\])*\1/g;
const ignoredClassNames = new Set(['active', 'visible']);

function cssFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return cssFiles(fullPath);
    if (entry.name.endsWith('.module.css')) return [];
    return entry.name.endsWith('.css') ? [fullPath] : [];
  });
}

const owners = new Map();
for (const file of cssFiles(stylesRoot)) {
  const relativeFile = path.relative(storefrontRoot, file).replaceAll('\\', '/');
  const css = readFileSync(file, 'utf8')
    .replace(cssCommentPattern, '')
    .replace(cssStringPattern, '');
  const classes = new Set(
    [...css.matchAll(classPattern)]
      .map((match) => match[1])
      .filter((className) => !ignoredClassNames.has(className))
  );
  for (const className of classes) {
    const files = owners.get(className) || [];
    files.push(relativeFile);
    owners.set(className, files);
  }
}

const duplicates = Object.fromEntries(
  [...owners.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([className, files]) => [className, files.sort()])
    .sort(([left], [right]) => left.localeCompare(right))
);

if (process.argv.includes('--write-baseline')) {
  writeFileSync(
    baselinePath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), duplicates }, null, 2)}\n`
  );
  console.log(`Wrote ${Object.keys(duplicates).length} duplicate selector owners to ${baselinePath}`);
  process.exit(0);
}

if (!existsSync(baselinePath)) {
  console.error('CSS ownership baseline is missing. Run: npm run audit:css-ownership -- --write-baseline');
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')).duplicates || {};
const findings = [];

for (const [className, files] of Object.entries(duplicates)) {
  const approved = baseline[className] || [];
  const newOwners = files.filter((file) => !approved.includes(file));
  if (newOwners.length) {
    findings.push(`.${className} gained owner(s): ${newOwners.join(', ')}`);
  }
}

if (findings.length) {
  console.error('CSS ownership audit failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(
  `CSS ownership audit passed: ${Object.keys(duplicates).length} existing duplicate selectors are ratcheted.`
);
