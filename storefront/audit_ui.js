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
  const relativePath = path.relative(srcDir, file);

  // Skip global css for design tokens definition, but we shouldn't have hex in other files
  const isGlobalCSS = file.includes('globals.css') || file.includes('tokens.css');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // 2. Color system: hardcoded hex
    if (!isGlobalCSS && /#[0-9a-fA-F]{3,6}\b/.test(line)) {
      results.colors.push(`${relativePath}:${lineNum} - ${line.trim()}`);
    }

    // 3. Spacing inconsistency: arbitrary px values in tailwind classes
    if (/(?:p[xytrbl]?|m[xytrbl]?|gap[xy]?|w|h)-\[\d+px\]/.test(line)) {
      results.spacing_px.push(`${relativePath}:${lineNum} - ${line.trim()}`);
    }

    // 1. Typography inconsistency: arbitrary px font sizes
    if (/text-\[\d+px\]/.test(line)) {
      results.typography_px.push(`${relativePath}:${lineNum} - ${line.trim()}`);
    }

    // 4. Buttons
    if (/<[bB]utton/.test(line) && line.includes('className') && !line.includes('variant')) {
      results.buttons.push(`${relativePath}:${lineNum} - ${line.trim()}`);
    }

    // 5, 6, 7. Just scanning for missing states is hard statically, but we can look for suspicious things
    // like map without fallback, or try/catch without error state, or fetch without loading state.
    // For now we just log some heuristics.
    if (line.includes('.map(') && !content.includes('length === 0') && !content.includes('length > 0')) {
      // Possible missing empty state
      // results.empty_states.push(`${relativePath}:${lineNum} - Array map used, but no length check found in file`);
    }
  }
}

let report = `# UI/UX Audit Report\n\n`;

report += `## 1. Typography Inconsistency (Arbitrary px sizes instead of tokens)\n`;
report += results.typography_px.length > 0 ? results.typography_px.map(x => `- ${x}`).join('\n') : "No arbitrary text-[px] found.\n";
report += `\n\n`;

report += `## 2. Color System Inconsistency (Hardcoded Hex Values)\n`;
report += results.colors.length > 0 ? results.colors.map(x => `- ${x}`).join('\n') : "No hardcoded hex values found.\n";
report += `\n\n`;

report += `## 3. Spacing Inconsistency (Arbitrary px sizes instead of tokens)\n`;
report += results.spacing_px.length > 0 ? results.spacing_px.map(x => `- ${x}`).join('\n') : "No arbitrary spacing px found.\n";
report += `\n\n`;

report += `## 4. Button Variants (Potentially missing standard variant)\n`;
report += results.buttons.length > 0 ? results.buttons.map(x => `- ${x}`).join('\n') : "All buttons seem to use standard or custom variants.\n";

fs.writeFileSync(path.join(__dirname, 'ui_ux_audit_report.md'), report);
console.log('Audit complete. Check ui_ux_audit_report.md');
