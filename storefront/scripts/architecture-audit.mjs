import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');
const appRoot = resolve(root, 'src/app');
const certify = process.argv.includes('--certify');
const findings = [];

function walk(directory, predicate) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path, predicate));
    else if (predicate(path)) files.push(path);
  }
  return files;
}

function routeFromPage(path) {
  const directory = relative(appRoot, resolve(path, '..')).split(sep).join('/');
  const visible = directory.split('/').filter((segment) => segment && !/^\(.+\)$/.test(segment)).map((segment) => segment.replaceAll('%5F', '_').replaceAll('%5f', '_'));
  return visible.length ? `/${visible.join('/')}` : '/';
}

const registryPath = resolve(root, 'src/design-system/route-contract.ts');
const registrySource = readFileSync(registryPath, 'utf8');
const registryAst = ts.createSourceFile(registryPath, registrySource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const registered = new Set();
function collectRegistry(node) {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'defineRoute') {
    const first = node.arguments[0];
    if (first && ts.isStringLiteral(first)) registered.add(first.text);
  }
  ts.forEachChild(node, collectRegistry);
}
collectRegistry(registryAst);

const pageFiles = walk(appRoot, (path) => path.endsWith(`${sep}page.tsx`));
const filesystemRoutes = new Map(pageFiles.map((path) => [routeFromPage(path), path]));
const mainLayoutSource = readFileSync(resolve(root, 'src/components/layout/MainLayout.tsx'), 'utf8');
const hasGlobalPageShell = /import\s*\{[^}]*PageShell[^}]*\}\s*from\s*['"]@\/design-system['"]/.test(mainLayoutSource) && /<PageShell>\{children\}<\/PageShell>/.test(mainLayoutSource);
for (const route of filesystemRoutes.keys()) if (!registered.has(route)) findings.push(`Unregistered route: ${route}`);
for (const route of registered) if (!filesystemRoutes.has(route)) findings.push(`Registry entry has no page.tsx: ${route}`);

const exceptionPath = resolve(root, 'src/design-system/visual-exceptions.ts');
const exceptionSource = readFileSync(exceptionPath, 'utf8');
const exceptionIds = new Set([...exceptionSource.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]));
for (const match of exceptionSource.matchAll(/reviewDate:\s*'(\d{4}-\d{2}-\d{2})'/g)) {
  if (new Date(`${match[1]}T23:59:59Z`) < new Date()) findings.push(`Expired visual exception review date: ${match[1]}`);
}
for (const match of registrySource.matchAll(/approvedExceptions:\s*\[([^\]]*)\]/g)) {
  for (const id of [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1])) {
    if (!exceptionIds.has(id)) findings.push(`Route references unknown exception: ${id}`);
  }
}

const storefrontImports = readFileSync(resolve(root, 'src/styles/storefront.css'), 'utf8').split(/\r?\n/).filter((line) => line.trim().startsWith('@import'));
for (const line of storefrontImports) if (!/\blayer\((?:base|components|utilities)\)/.test(line)) findings.push(`Unlayered storefront import: ${line.trim()}`);
for (const modulePath of walk(resolve(root, 'src'), (path) => path.endsWith('.module.css'))) {
  if (!readFileSync(modulePath, 'utf8').includes('@layer components')) findings.push(`CSS Module is outside components layer: ${relative(root, modulePath)}`);
}
for (const legacyPath of walk(resolve(root, 'src'), (path) => /\.(?:tsx?|css)$/.test(path))) {
  const source = readFileSync(legacyPath, 'utf8');
  if (/\bkv-(?:container|page-container)\b/.test(source)) findings.push(`Legacy layout consumer remains: ${relative(root, legacyPath)}`);
  if (/\b[a-z0-9-]+-prem(?:ium)?\b/i.test(source)) findings.push(`Legacy premium selector remains: ${relative(root, legacyPath)}`);
}

for (const prohibitedOverride of ['mobile-overrides.css', 'theme-overrides.css', 'responsive.css']) {
  if (storefrontImports.some((line) => line.includes(prohibitedOverride))) findings.push(`Broad override stylesheet remains active: ${prohibitedOverride}`);
}

const migration = { pageShell: 0, localStyledH1: 0, deepUiImports: 0, nativeStyledControls: 0, arbitraryVisualUtilities: 0 };
for (const [route, path] of filesystemRoutes) {
  const source = readFileSync(path, 'utf8');
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let importsPublicShell = false;
  function inspect(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (specifier === '@/design-system' && node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
        importsPublicShell ||= node.importClause.namedBindings.elements.some((element) => element.name.text === 'PageShell');
      }
      if (specifier.startsWith('@/components/ui/')) migration.deepUiImports += 1;
    }
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const tag = opening.tagName.getText(ast);
      const classAttribute = opening.attributes.properties.find((attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText(ast) === 'className');
      if (tag === 'h1' && classAttribute) migration.localStyledH1 += 1;
      if ((tag === 'button' || tag === 'select' || tag === 'textarea' || tag === 'input') && classAttribute) migration.nativeStyledControls += 1;
    }
    ts.forEachChild(node, inspect);
  }
  inspect(ast);
  if (importsPublicShell || hasGlobalPageShell) migration.pageShell += 1;
  if (certify && !importsPublicShell && !hasGlobalPageShell && route !== '/categories' && route !== '/categories/[slug]') findings.push(`${route} must consume PageShell from @/design-system`);
  migration.arbitraryVisualUtilities += (source.match(/(?<![\w-])(?:text|bg|border|rounded|p[xy]?|m[xy]?|gap|w|max-w|min-h|h)-\[[^\]]+\]/g) || []).length;
}

if (certify) {
  if (migration.localStyledH1) findings.push(`${migration.localStyledH1} route-local styled h1 elements remain`);
  if (migration.deepUiImports) findings.push(`${migration.deepUiImports} route deep imports from components/ui remain`);
  if (migration.nativeStyledControls) findings.push(`${migration.nativeStyledControls} styled native controls remain in routes`);
  if (migration.arbitraryVisualUtilities) findings.push(`${migration.arbitraryVisualUtilities} arbitrary visual utilities remain in routes`);
}

console.log(JSON.stringify({ mode: certify ? 'certification' : 'foundation', routes: filesystemRoutes.size, registered: registered.size, migration }, null, 2));
if (findings.length) {
  console.error('Architecture audit failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log(certify ? 'Architecture certification audit passed.' : 'Architecture foundation audit passed; certification migration metrics are reported above.');
