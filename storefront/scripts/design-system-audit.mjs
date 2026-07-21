import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectDesignSystemMetrics } from './design-system-metrics.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const storefrontRoot = path.resolve(scriptDir, '..');
const workspaceRoot = path.resolve(storefrontRoot, '..');
const roots = [path.join(storefrontRoot, 'src')];
const extraFiles = [
  path.join(workspaceRoot, 'docs/design-system/storefront-design-system-v1.md'),
  path.join(workspaceRoot, 'docs/project_features_guide.md'),
  path.join(storefrontRoot, 'AGENTS.md'),
  path.join(storefrontRoot, 'KVASTRAM_HEADER_DESIGN_SYSTEM.md'),
];
const baseline = JSON.parse(
  readFileSync(path.join(storefrontRoot, 'scripts/design-system-baseline.json'), 'utf8')
);
const allowedRawHexFiles = new Set([path.normalize('src/styles/tokens.css')]);
const allowedImportantFiles = new Set([path.normalize('src/styles/animations.css')]);
const allowedLegacyFontFiles = new Set([
  path.normalize('src/styles/utilities.css'),
  path.normalize('src/app/globals.css'),
  path.normalize('src/styles/theme.generated.css'),
]);
const checkedExtensions = new Set(['.css', '.ts', '.tsx', '.md']);
const defaultPalettePattern =
  /\b(?:text|bg|border|ring|fill|stroke|placeholder|from|via|to|decoration|divide|accent)-(?:white|black|stone|neutral|zinc|gray|slate|amber|rose|emerald|blue|green|red|yellow|pink|purple)(?:-[0-9]{2,3})?(?:\/[0-9]{1,3})?\b/g;
const localCtaClassPattern =
  /\b(account-primary-action|account-secondary-action|content-button|search-empty-action|error-primary-action|error-secondary-action)\b/;
const rawNumericRgbPattern = /rgba?\(\s*(?:\d{1,3}\s*,\s*){2}\d{1,3}/i;
const namedColorDeclarationPattern =
  /\b(?:color|background(?:-color)?|border(?:-(?:top|right|bottom|left))?(?:-color)?|outline-color|text-decoration-color|fill|stroke)\s*:[^;]*(?<![a-z-])(?:white|black)\b/i;
const legacyAccentNamePattern = /\b(?:sienna|coral)\b/i;
const malformedUtilityPattern = /\](?:-head|-head-centered|-link)\b/;
const homepageWidthFormulaPattern =
  /w-\[min\(calc\(100%-\(var\(--homepage-gutter\)\*2\)\),var\(--ds-home-content-width\)\)\]/;
const legacyAliasUsagePattern = /var\(\s*--(?:ink|cream|line|soft|muted)\b/i;
const targetTouchFiles = new Map([
  [path.normalize('src/components/ui/Button.tsx'), /\b(?:min-h-9|h-9 w-9|h-10 w-10)\b/],
  [path.normalize('src/components/products/ProductCard.tsx'), /\b(?:w-\[34px\]|h-\[34px\])\b/],
  [path.normalize('src/components/header/ActionsRight.tsx'), /\bh-9 w-9\b/],
  [path.normalize('src/components/header/mobile/MobileTopBar.tsx'), /\bh-10 w-10\b/],
  [path.normalize('src/components/ui/CookieConsent.tsx'), /\b(?:min-h-9|min-h-10)\b/],
  [path.normalize('src/components/layout/CartDrawer.tsx'), /\bw-7 h-7\b/],
  [path.normalize('src/app/checkout/page.tsx'), /\bw-8 h-8\b/],
  [path.normalize('src/components/search/SearchOverlay.tsx'), /\bmin-h-8\b/],
  [path.normalize('src/components/products/FilterSidebar.tsx'), /\b(?:min-h-8|h-8 w-8)\b/],
  [path.normalize('src/app/wishlist/page.tsx'), /\bh-8 w-8\b/],
  [path.normalize('src/app/login/page.tsx'), /\bh-8 w-8\b/],
  [path.normalize('src/app/register/page.tsx'), /\bh-8 w-8\b/],
  [path.normalize('src/app/reset-password/page.tsx'), /\bh-8 w-8\b/],
  [path.normalize('src/components/layout/MainLayout.tsx'), /\bw-10 h-10\b/],
  [path.normalize('src/components/BannerCarousel.tsx'), /className=\{`h-2 min-h-0|className="h-2 min-h-0/],
  [path.normalize('src/components/TestimonialsCarousel.tsx'), /className=\{`h-2 min-h-0|className="h-2 min-h-0/],
  [path.normalize('src/components/product/ProductGallery.tsx'), /className=\{`h-2 rounded|className="h-2 rounded/],
]);
const allowedInlineStylePatterns = [
  /style=\{\{\s*animationDelay:/,
  /style=\{\{\s*width:\s*`/,
  /style=\{\{\s*width:\s*workflowIndex/,
  /style=\{\{\s*background:\s*getColorHex/,
  /style=\{\{\s*backgroundColor:\s*category\.iconBg/,
  /style=\{\{\s*animationDuration:\s*speed/,
  /<PayPalButtons/,
  /layout:\s*'vertical'/,
  /color:\s*'black'/,
  /shape:\s*'rect'/,
  /label:\s*'pay'/,
  /height:\s*48/,
];

const requiredRuntimeTokenValues = new Map([
  ['--ds-font-display', "var(--font-amiri), var(--font-cardo), serif"],
  ['--ds-font-body', 'var(--font-cardo), serif'],
  ['--ds-accent-primary', '#000000'],
  ['--ds-accent-hover', '#1A1A1A'],
  ['--ds-surface-page', '#FFFFFF'],
  ['--ds-surface-paper', '#FFFFFF'],
  ['--ds-surface-soft', '#F7F7F7'],
  ['--ds-border-subtle', '#E5E5E5'],
  ['--ds-text-primary', '#000000'],
  ['--ds-text-secondary', '#333333'],
  ['--ds-text-muted', '#666666'],
  ['--ds-home-gutter-mobile', '1.25rem'],
  ['--ds-home-gutter-tablet', '2rem'],
  ['--ds-home-gutter-desktop', '3rem'],
  ['--ds-home-section-space-mobile', '56px'],
  ['--ds-home-section-space-desktop', '96px'],
]);

const requiredDocSnippets = [
  'Amiri',
  'Cardo',
  '`20px` mobile',
  '`32px` tablet',
  '`48px` desktop',
  '`96px` desktop',
  '`56px` mobile',
  '`--ink`, `--cream`, and `--line` remain compatibility-only aliases and must not be consumed by runtime TSX.',
  'Raw `var(--ds-*)` usage in TSX is allowed only as a Tailwind arbitrary-value escape hatch when no semantic utility exists.',
];

const findings = [];
const definedDesignTokens = new Set();
const usedDesignTokens = new Map();

const tokenSource = readFileSync(path.join(storefrontRoot, 'src/styles/tokens.css'), 'utf8');
const designSystemDoc = readFileSync(
  path.join(workspaceRoot, 'docs/design-system/storefront-design-system-v1.md'),
  'utf8'
);
const agentsDoc = readFileSync(path.join(storefrontRoot, 'AGENTS.md'), 'utf8');
const featuresGuide = readFileSync(
  path.join(workspaceRoot, 'docs/project_features_guide.md'),
  'utf8'
);
const homepagePrimitiveSource = readFileSync(
  path.join(storefrontRoot, 'src/components/ui/HomepageSection.tsx'),
  'utf8'
);
const rootLayoutSource = readFileSync(path.join(storefrontRoot, 'src/app/layout.tsx'), 'utf8');
const utilitySource = readFileSync(path.join(storefrontRoot, 'src/styles/utilities.css'), 'utf8');

if (!/homepageScrollRailClassName[\s\S]*['"]flex overflow-x-auto/.test(homepagePrimitiveSource)) {
  findings.push('Homepage scroll rail primitive must own display:flex before overflow behavior');
}

if (!/import\s+localFont\s+from\s+['"]next\/font\/local['"]/.test(rootLayoutSource)) {
  findings.push('Root layout must vendor Amiri and Cardo through next/font/local');
}

if (!/<html[\s\S]*className=\{`\$\{fontCardo\.variable\} \$\{fontAmiri\.variable\}`\}/.test(rootLayoutSource)) {
  findings.push('Next font variables must be attached to the root html element before :root tokens resolve');
}

for (const requiredFontPath of [
  '../assets/fonts/Cardo-Regular.ttf',
  '../assets/fonts/Cardo-Italic.ttf',
  '../assets/fonts/Cardo-Bold.ttf',
  '../assets/fonts/Amiri-Regular.ttf',
  '../assets/fonts/Amiri-Italic.ttf',
  '../assets/fonts/Amiri-Bold.ttf',
  '../assets/fonts/Amiri-BoldItalic.ttf',
]) {
  if (!rootLayoutSource.includes(requiredFontPath)) {
    findings.push(`Root layout must vendor required font asset: ${requiredFontPath}`);
  }
}

if (!/\.text-inverse\s*\{\s*color:\s*var\(--ds-text-inverse\)/.test(utilitySource)) {
  findings.push('Semantic text-inverse utility must have an explicit runtime CSS owner');
}

function stripCssComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '');
}

function extractRootCustomProperties(cssText) {
  const css = stripCssComments(cssText);
  const rootStart = css.indexOf(':root');
  if (rootStart < 0) return new Map();
  const blockStart = css.indexOf('{', rootStart);
  if (blockStart < 0) return new Map();

  let depth = 0;
  let blockEnd = -1;
  for (let index = blockStart; index < css.length; index += 1) {
    const char = css[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        blockEnd = index;
        break;
      }
    }
  }

  if (blockEnd < 0) return new Map();
  const body = css.slice(blockStart + 1, blockEnd);
  const values = new Map();

  for (const declaration of body.split(';')) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex < 0) continue;
    const property = declaration.slice(0, colonIndex).trim();
    const value = declaration.slice(colonIndex + 1).trim();
    if (property.startsWith('--ds-')) {
      values.set(property, value);
    }
  }

  return values;
}

const runtimeTokens = extractRootCustomProperties(tokenSource);
for (const [tokenName, expectedValue] of requiredRuntimeTokenValues) {
  const actualValue = runtimeTokens.get(tokenName);
  if (actualValue !== expectedValue) {
    findings.push(`${tokenName} must equal "${expectedValue}" in tokens.css (found "${actualValue || 'missing'}")`);
  }
}

for (const snippet of requiredDocSnippets) {
  if (!designSystemDoc.includes(snippet) && !agentsDoc.includes(snippet) && !featuresGuide.includes(snippet)) {
    findings.push(`Documentation sync: expected snippet missing -> ${snippet}`);
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!checkedExtensions.has(path.extname(entry.name))) continue;
    auditFile(fullPath);
  }
}

function auditFile(fullPath) {
  const rel = path.normalize(path.relative(storefrontRoot, fullPath));
  const ext = path.extname(rel);
  const text = readFileSync(fullPath, 'utf8');
  const lines = text.split(/\r?\n/);

  if (ext === '.md') {
    return;
  }

  for (const match of text.matchAll(/(--ds-[a-z0-9-]+)\s*:/gi)) {
    definedDesignTokens.add(match[1]);
  }
  for (const match of text.matchAll(/var\(\s*(--ds-[a-z0-9-]+)/gi)) {
    if (!usedDesignTokens.has(match[1])) usedDesignTokens.set(match[1], []);
    usedDesignTokens.get(match[1]).push(rel);
  }

  lines.forEach((line, index) => {
    const location = `${rel}:${index + 1}`;

    if (/#[0-9a-f]{3,8}\b/i.test(line) && !allowedRawHexFiles.has(rel)) {
      findings.push(`${location} raw hex should be a --ds-* token`);
    }

    if (/!important/.test(line) && !allowedImportantFiles.has(rel)) {
      findings.push(`${location} avoid !important outside documented accessibility exceptions`);
    }

    if (/\bfont-(serif|heading)\b/.test(line) && !allowedLegacyFontFiles.has(rel)) {
      findings.push(`${location} legacy font utility should use font-display or font-body`);
    }

    if (/[ÃƒÃ¢ï¿½]/.test(line)) {
      findings.push(`${location} likely mojibake/encoding artifact in UI source`);
    }

    if (legacyAccentNamePattern.test(line)) {
      findings.push(`${location} legacy accent naming is superseded by TERRACOTTA`);
    }

    if (defaultPalettePattern.test(line)) {
      findings.push(`${location} default Tailwind palette utility should use --ds-* tokens`);
      defaultPalettePattern.lastIndex = 0;
    }

    if (ext === '.tsx' && localCtaClassPattern.test(line)) {
      findings.push(`${location} local CTA class should use Button, ButtonLink, or ButtonAnchor`);
    }

    if (rawNumericRgbPattern.test(line)) {
      findings.push(`${location} raw rgb/rgba values should use --ds-*-rgb channels`);
    }

    if (ext === '.css' && namedColorDeclarationPattern.test(line)) {
      findings.push(`${location} named white/black color should use a --ds-* token`);
    }

    if (ext === '.css' && /\.legacy-[a-z0-9-]+/i.test(line)) {
      findings.push(`${location} legacy CSS selector should be removed or renamed to the active primitive contract`);
    }

    if (/\b(?:warm-white|kv-white)\b/.test(line)) {
      findings.push(`${location} legacy white alias should use --ds-surface-* or component-scoped paper tokens`);
    }

    if (malformedUtilityPattern.test(line)) {
      findings.push(`${location} malformed utility fragment should be replaced by a shared primitive or valid utility list`);
    }

    if (homepageWidthFormulaPattern.test(line)) {
      findings.push(`${location} homepage width formula should use HomepageContainer or HomepageSection primitives`);
    }

    if (legacyAliasUsagePattern.test(line)) {
      findings.push(`${location} legacy color alias usage should be replaced with --ds-* tokens or semantic utilities`);
    }

    const touchPattern = targetTouchFiles.get(rel);
    if (touchPattern?.test(line)) {
      findings.push(`${location} interactive control fell below the 44px minimum touch target`);
    }

    if (/style=\{\{/.test(line)) {
      const allowed =
        rel === path.normalize('src/components/checkout/PayPalButton.tsx') ||
        allowedInlineStylePatterns.some((pattern) => pattern.test(line));
      if (!allowed) {
        findings.push(`${location} inline style needs an audit allowlist entry or a class/token replacement`);
      }
    }

    const selfReference = line.match(/(--ds-[a-z0-9-]+):\s*var\(\1\)/i);
    if (selfReference) {
      findings.push(`${location} design token cannot self-reference itself`);
    }
  });
}

for (const root of roots) walk(root);
for (const file of extraFiles) auditFile(file);

for (const [token, rels] of usedDesignTokens) {
  if (!definedDesignTokens.has(token)) {
    const locations = Array.from(new Set(rels)).slice(0, 3).join(', ');
    findings.push(`${token} is referenced but not defined in the active design-system sources (${locations})`);
  }
}

const metrics = collectDesignSystemMetrics();

if (metrics.nativeStyledButtons > baseline.nativeStyledButtons) {
  findings.push(
    `P0 ratchet: native styled buttons increased from ${baseline.nativeStyledButtons} to ${metrics.nativeStyledButtons}. Use src/components/ui/Button.tsx or reduce the baseline after migration.`
  );
}

if (metrics.defaultPaletteRefs > baseline.defaultPaletteRefs) {
  findings.push(
    `P0 ratchet: default Tailwind palette refs increased from ${baseline.defaultPaletteRefs} to ${metrics.defaultPaletteRefs}. Use --ds-* tokens or reduce the baseline after migration.`
  );
}

if (metrics.uiDefaultPaletteRefs > baseline.uiDefaultPaletteRefs) {
  findings.push(
    `P0 ratchet: default palette refs in src/components/ui increased from ${baseline.uiDefaultPaletteRefs} to ${metrics.uiDefaultPaletteRefs}. Shared primitives should use explicit --ds-* tokens.`
  );
}

if (findings.length) {
  console.error('Design system audit failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('Design system audit passed: runtime tokens, docs, primitives, and touch targets are consistent.');
