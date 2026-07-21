import fs from 'fs';
import path from 'path';

const replacements = [
  { from: /bg-\[var\(--ds-surface-paper\)\]/g, to: 'bg-white' },
  { from: /bg-\[var\(--ds-surface-page\)\]/g, to: 'bg-brand-cream' },
  { from: /bg-\[var\(--ds-surface-soft\)\]/g, to: 'bg-brand-soft' },
  { from: /text-\[var\(--ds-text-primary\)\]/g, to: 'text-black' },
  { from: /text-\[var\(--ds-text-secondary\)\]/g, to: 'text-text-secondary' },
  { from: /text-\[var\(--ds-text-muted\)\]/g, to: 'text-text-muted' },
  { from: /text-\[var\(--ds-text-inverse\)\]/g, to: 'text-text-inverse' },
  { from: /border-\[var\(--ds-border-subtle\)\]/g, to: 'border-brand-line' },
];

function processDirectory(dir) {
  let count = 0;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      count += processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      for (const { from, to } of replacements) {
        content = content.replace(from, to);
      }
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        count++;
      }
    }
  }
  return count;
}

const dirToProcess = path.resolve('./src');
console.log(`Starting refactor in ${dirToProcess}`);
const modified = processDirectory(dirToProcess);
console.log(`Refactor complete. Modified ${modified} files.`);
