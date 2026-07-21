import fs from 'fs';
import path from 'path';

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else {
      filelist.push(filepath);
    }
  }
  return filelist;
}

const files = walkSync('./src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
let totalReplaced = 0;

// These are the broken token→class mappings the first script created.
// bg-text-primary should be bg-primary (since --color-primary = --ds-text-primary)
// bg-text-secondary should be bg-secondary
// bg-text-muted should be bg-muted
// border-text-primary should be border-primary
// border-text-secondary should be border-secondary
const replacements = [
  // bg-
  [/\bbg-text-primary\b/g, 'bg-primary'],
  [/\bbg-text-secondary\b/g, 'bg-secondary'],
  [/\bbg-text-muted\b/g, 'bg-muted'],
  [/\bbg-text-disabled\b/g, 'bg-[var(--ds-text-disabled)]'],
  // hover:bg-
  [/\bhover:bg-text-primary\b/g, 'hover:bg-primary'],
  [/\bhover:bg-text-secondary\b/g, 'hover:bg-secondary'],
  [/\bhover:bg-text-muted\b/g, 'hover:bg-muted'],
  // border-
  [/\bborder-text-primary\b/g, 'border-primary'],
  [/\bborder-text-secondary\b/g, 'border-secondary'],
  [/\bborder-text-muted\b/g, 'border-muted'],
  // ring-
  [/\bring-text-primary\b/g, 'ring-primary'],
  // Also fix bg-surface-paper-rgb, bg-black-rgb etc that may have leaked
  [/\bbg-surface-paper-rgb\b/g, 'bg-surface-paper'],
  // fix text-text-primary (nonsense doubled prefix from script)
  [/\btext-text-primary\b/g, 'text-primary'],
  [/\btext-text-secondary\b/g, 'text-secondary'],
  [/\btext-text-muted\b/g, 'text-muted'],
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    totalReplaced++;
  }
}

console.log(`Fixed broken class names in ${totalReplaced} files.`);
