import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const routeContractPath = path.join(root, 'src/design-system/route-contract.ts');

const defaultStates = ['populated', 'empty', 'loading', 'error', 'missing-media', 'long-copy'];

function evaluateString(node) {
  return ts.isStringLiteral(node) ? node.text : null;
}

function evaluateStringArray(node) {
  if (!ts.isArrayLiteralExpression(node)) return null;
  return node.elements
    .map((element) => (ts.isStringLiteral(element) ? element.text : null))
    .filter(Boolean);
}

function evaluateObjectLiteral(node) {
  if (!ts.isObjectLiteralExpression(node)) return {};
  const result = {};
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = ts.isIdentifier(property.name)
      ? property.name.text
      : ts.isStringLiteral(property.name)
        ? property.name.text
        : null;
    if (!key) continue;
    const stringValue = evaluateString(property.initializer);
    if (stringValue !== null) {
      result[key] = stringValue;
      continue;
    }
    const stringArray = evaluateStringArray(property.initializer);
    if (stringArray !== null) {
      result[key] = stringArray;
    }
  }
  return result;
}

export function readRouteContracts() {
  const source = readFileSync(routeContractPath, 'utf8');
  const file = ts.createSourceFile(
    routeContractPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const routes = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'defineRoute'
    ) {
      const [patternNode, kindNode, overridesNode] = node.arguments;
      const pattern = evaluateString(patternNode);
      const pageKind = evaluateString(kindNode);
      if (!pattern || !pageKind) {
        ts.forEachChild(node, visit);
        return;
      }

      const overrides = overridesNode ? evaluateObjectLiteral(overridesNode) : {};
      const testFixture =
        overrides.testFixture ||
        pattern
          .replace('[handle]', 'kantha-jacket')
          .replace('[slug]', 'fixture-slug')
          .replace('[id]', 'fixture-id');

      routes.push({
        pattern,
        pageKind,
        chromeMode:
          overrides.chromeMode ||
          (pattern.startsWith('/wholesale')
            ? 'wholesale'
            : pattern.startsWith('/checkout')
              ? 'checkout'
              : 'store'),
        testFixture,
        requiredVisualStates: overrides.requiredVisualStates || defaultStates,
        approvedExceptions: overrides.approvedExceptions || [],
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(file);
  return routes;
}
