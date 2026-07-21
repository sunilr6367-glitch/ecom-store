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

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Replace bg-[var(--ds-surface-paper)] -> bg-surface-paper
  // The regex matches (bg|text|border|ring|fill|stroke)-\[var\(--ds-([a-zA-Z0-9-]+)\)\]
  content = content.replace(/(bg|text|border|ring|fill|stroke|hover:bg|hover:text|hover:border|focus:border|focus:ring)-\[var\(--ds-([a-zA-Z0-9-]+)\)\]/g, (match, prefix, varName) => {
    // Special mapping for accent-primary -> accent (since text-accent exists in our Tailwind config, and --color-accent)
    if (varName === 'accent-primary') return `${prefix}-accent`;
    if (varName === 'border-strong') return `${prefix}-border`;
    return `${prefix}-${varName}`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    totalReplaced++;
  }
}

console.log(`Replaced raw vars in ${totalReplaced} files.`);
