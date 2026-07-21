import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const srcRoot = path.resolve('src');
const checkedExtensions = new Set(['.css', '.ts', '.tsx']);
const tsxExtensions = new Set(['.ts', '.tsx']);

const defaultPalettePattern =
  /\b(?:text|bg|border|ring|fill|stroke|placeholder|from|via|to|decoration|divide|accent)-(?:white|black|stone|neutral|zinc|gray|slate|amber|rose|emerald|blue|green|red|yellow|pink|purple)(?:-[0-9]{2,3})?(?:\/[0-9]{1,3})?\b/g;
const legacyButtonClassPattern = /\b(?:kv-btn|btn-primary|btn-outline|btn-[a-z0-9-]+)\b/g;
const classAttributePattern =
  /className\s*=\s*(?:"[^"]*"|'[^']*'|`[\s\S]*?`|\{`[\s\S]*?`\})/g;
const legacyButtonCssSelectorPattern = /\.(?:kv-btn|btn-primary|btn-outline|btn-[a-z0-9-]+)\b/g;

const approvedNativeButtonFiles = new Set([
  path.normalize('src/components/ui/Button.tsx'),
]);

const componentUsagePatterns = {
  Button: /<Button\b/g,
  ButtonLink: /<ButtonLink\b/g,
  ButtonAnchor: /<ButtonAnchor\b/g,
  Input: /<Input\b/g,
  Textarea: /<Textarea\b/g,
  Select: /<Select\b/g,
  Card: /<Card\b/g,
  Modal: /<Modal\b/g,
  Drawer: /<Drawer\b/g,
  ProductCard: /<ProductCard\b/g,
  CompactProductCard: /<CompactProductCard\b/g,
  Badge: /<Badge\b/g,
  TrustBadge: /<TrustBadge\b/g,
};

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, out);
      continue;
    }
    if (checkedExtensions.has(path.extname(entry.name))) out.push(fullPath);
  }
  return out;
}

function relPath(fullPath) {
  return path.normalize(path.relative(process.cwd(), fullPath));
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

function countNativeStyledButtons(rel, text) {
  if (!tsxExtensions.has(path.extname(rel))) return 0;
  if (approvedNativeButtonFiles.has(rel)) return 0;
  const tags = text.match(/<button\b[\s\S]*?>/g) || [];
  return tags.filter((tag) => /\bclassName\s*=/.test(tag)).length;
}

function countLegacyButtonClassRefs(rel, text) {
  const ext = path.extname(rel);

  if (ext === '.css') {
    return countMatches(text, legacyButtonCssSelectorPattern);
  }

  if (!tsxExtensions.has(ext)) return 0;

  const classAttributes = text.match(classAttributePattern) || [];
  return classAttributes.reduce(
    (total, attr) => total + countMatches(attr, legacyButtonClassPattern),
    0
  );
}

function collectDesignSystemMetrics() {
  const files = walk(srcRoot);
  const metrics = {
    cssFiles: 0,
    componentTsxFiles: 0,
    nativeStyledButtons: 0,
    defaultPaletteRefs: 0,
    uiDefaultPaletteRefs: 0,
    inlineStyleBlocks: 0,
    dynamicClassCompositions: 0,
    legacyButtonClassRefs: 0,
    components: Object.fromEntries(
      Object.keys(componentUsagePatterns).map((name) => [name, 0])
    ),
  };

  for (const fullPath of files) {
    const rel = relPath(fullPath);
    const ext = path.extname(rel);
    const text = readFileSync(fullPath, 'utf8');

    if (ext === '.css') metrics.cssFiles += 1;
    if (rel.startsWith(path.normalize('src/components/')) && ext === '.tsx') {
      metrics.componentTsxFiles += 1;
    }

    metrics.nativeStyledButtons += countNativeStyledButtons(rel, text);
    metrics.inlineStyleBlocks += countMatches(text, /style=\{\{/g);
    metrics.dynamicClassCompositions += countMatches(
      text,
      /className=\{(?:`|cn\(|clsx\(|\[)/g
    );
    metrics.legacyButtonClassRefs += countLegacyButtonClassRefs(rel, text);

    if (tsxExtensions.has(ext)) {
      metrics.defaultPaletteRefs += countMatches(text, defaultPalettePattern);
    }
    if (rel.startsWith(path.normalize('src/components/ui/'))) {
      metrics.uiDefaultPaletteRefs += countMatches(text, defaultPalettePattern);
    }

    for (const [name, pattern] of Object.entries(componentUsagePatterns)) {
      metrics.components[name] += countMatches(text, pattern);
    }
  }

  return metrics;
}

function printMetrics(metrics) {
  const rows = [
    ['CSS owner files', metrics.cssFiles],
    ['Component TSX files', metrics.componentTsxFiles],
    ['Native styled buttons', metrics.nativeStyledButtons],
    ['Shared Button usages', metrics.components.Button],
    ['Shared ButtonLink usages', metrics.components.ButtonLink],
    ['Shared ButtonAnchor usages', metrics.components.ButtonAnchor],
    ['Legacy button class refs', metrics.legacyButtonClassRefs],
    ['Default palette refs', metrics.defaultPaletteRefs],
    ['UI default palette refs', metrics.uiDefaultPaletteRefs],
    ['Inline style blocks', metrics.inlineStyleBlocks],
    ['Dynamic class compositions', metrics.dynamicClassCompositions],
    ['Input usages', metrics.components.Input],
    ['Textarea usages', metrics.components.Textarea],
    ['Select usages', metrics.components.Select],
    ['Card usages', metrics.components.Card],
    ['Modal usages', metrics.components.Modal],
    ['Drawer usages', metrics.components.Drawer],
    ['ProductCard usages', metrics.components.ProductCard],
    ['CompactProductCard usages', metrics.components.CompactProductCard],
    ['Badge usages', metrics.components.Badge],
    ['TrustBadge usages', metrics.components.TrustBadge],
  ];

  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  console.log('Design system adoption dashboard');
  console.log('='.repeat('Design system adoption dashboard'.length));
  for (const [label, value] of rows) {
    console.log(`${label.padEnd(labelWidth)}  ${value}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const metrics = collectDesignSystemMetrics();
  printMetrics(metrics);
}

export { collectDesignSystemMetrics, defaultPalettePattern };
