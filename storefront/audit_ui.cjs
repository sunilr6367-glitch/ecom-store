/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const results = {
  colors: [],
  spacing_px: [],
  typography_px: [],
  buttons: [],
  empty_states: [],
  loading_states: [],
  error_states: []
};

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walk(filepath, filelist);
    } else {
      if (filepath.endsWith('.tsx') || filepath.endsWith('.ts') || filepath.endsWith('.jsx') || filepath.endsWith('.js') || filepath.endsWith('.css')) {
        filelist.push(filepath);
      }
    }
  }
  return filelist;
}

const files = walk(srcDir);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(srcDir, file).replace(/\\/g, '/');

  // Skip global css for design tokens definition
  const isGlobalCSS = file.includes('globals.css') || file.includes('tokens.css') || file.includes('design-system.css');
  
  // Track state handlers heuristics
  let hasMap = false;
  let hasLengthCheck = false;
  let hasLoading = false;
  let hasError = false;
  let hasFetch = false;
  let hasAsync = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // 2. Color system: hardcoded hex
    if (!isGlobalCSS && /#[0-9a-fA-F]{3,6}\b/.test(line)) {
      results.colors.push(`${relativePath}:${lineNum}`);
    }

    // 3. Spacing inconsistency: arbitrary px values in tailwind classes
    if (/(?:p[xytrbl]?|m[xytrbl]?|gap[xy]?|w|h)-\[\d+px\]/.test(line)) {
      results.spacing_px.push(`${relativePath}:${lineNum}`);
    }

    // 1. Typography inconsistency: arbitrary px font sizes
    if (/text-\[\d+px\]/.test(line)) {
      results.typography_px.push(`${relativePath}:${lineNum}`);
    }

    // 4. Buttons: using raw HTML <button> instead of <Button>, or custom variants
    if (/<button\b/.test(line) && line.includes('className=')) {
      results.buttons.push(`${relativePath}:${lineNum} (raw <button> with classes)`);
    } else if (/<Button\b/.test(line) && line.includes('className=') && !line.includes('variant=')) {
      results.buttons.push(`${relativePath}:${lineNum} (<Button> with classes but no variant)`);
    }

    // 5. Empty States
    if (line.includes('.map(')) hasMap = true;
    if (line.includes('.length') || line.includes('length === 0') || line.includes('length > 0') || line.includes('?')) hasLengthCheck = true;

    // 6. Error States & 7. Loading States
    if (line.includes('fetch(') || line.includes('useQuery') || line.includes('useSWR') || line.includes('axios.')) hasFetch = true;
    if (line.includes('async ')) hasAsync = true;
    if (line.includes('isLoading') || line.includes('loading') || line.includes('Skeleton') || line.includes('Spinner')) hasLoading = true;
    if (line.includes('error') || line.includes('isError') || line.includes('catch ') || line.includes('Alert')) hasError = true;
  }

  // Very basic heuristic checks for missing states
  if (hasMap && !hasLengthCheck) {
    results.empty_states.push(`${relativePath}:1 (Contains .map() but no length check or fallback)`);
  }
  if ((hasFetch || hasAsync) && !hasLoading && file.endsWith('.tsx')) {
    results.loading_states.push(`${relativePath}:1 (Contains async/fetch but no loading state UI)`);
  }
  if ((hasFetch || hasAsync) && !hasError && file.endsWith('.tsx')) {
    results.error_states.push(`${relativePath}:1 (Contains async/fetch but no error state UI)`);
  }
}

let report = `# Storefront UI/UX Audit Report\n\n`;

report += `## 1. Typography Inconsistency\n(Files using arbitrary px sizes like \`text-[14px]\` instead of tokens)\n\n`;
report += results.typography_px.length > 0 ? results.typography_px.map(x => `- ${x}`).join('\n') : "✅ No arbitrary text-[px] found.\n";
report += `\n\n`;

report += `## 2. Color System Inconsistency\n(Files with hardcoded hex values instead of design tokens)\n\n`;
report += results.colors.length > 0 ? results.colors.map(x => `- ${x}`).join('\n') : "✅ No hardcoded hex values found.\n";
report += `\n\n`;

report += `## 3. Spacing Inconsistency\n(Files using arbitrary px sizes like \`p-[10px]\` or \`w-[100px]\` instead of tokens)\n\n`;
report += results.spacing_px.length > 0 ? results.spacing_px.map(x => `- ${x}`).join('\n') : "✅ No arbitrary spacing px found.\n";
report += `\n\n`;

report += `## 4. Button Variants Inconsistency\n(Raw \`<button>\` or \`<Button>\` without a standard variant)\n\n`;
report += results.buttons.length > 0 ? results.buttons.map(x => `- ${x}`).join('\n') : "✅ All buttons seem to use standard variants.\n";
report += `\n\n`;

report += `## 5. Potential Missing Empty States\n(Lists mapped without length fallbacks)\n\n`;
report += results.empty_states.length > 0 ? results.empty_states.map(x => `- ${x}`).join('\n') : "✅ No missing empty states detected via basic heuristic.\n";
report += `\n\n`;

report += `## 6. Potential Missing Error States\n(Async/fetch logic without error UI)\n\n`;
report += results.error_states.length > 0 ? results.error_states.map(x => `- ${x}`).join('\n') : "✅ No missing error states detected via basic heuristic.\n";
report += `\n\n`;

report += `## 7. Potential Missing Loading States\n(Async/fetch logic without loading/spinner UI)\n\n`;
report += results.loading_states.length > 0 ? results.loading_states.map(x => `- ${x}`).join('\n') : "✅ No missing loading states detected via basic heuristic.\n";

fs.writeFileSync(path.join(__dirname, 'ui_ux_audit_report.md'), report);
console.log('Audit complete.');
