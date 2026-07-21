import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('src');

const REPLACEMENTS = [
  [/\btext-text-disabled\b/g, 'text-disabled'],
  [/\btext-text-inverse\b/g, 'text-inverse'],
  [/\btext-text-price\b/g, 'text-price'],
  [/\btext-text-price-old\b/g, 'text-price-old'],
  [/\btext-text-body-xl\b/g, 'text-body-xl'],
  [/\btext-text-body-lg\b/g, 'text-body-lg'],
  [/\btext-text-body-md\b/g, 'text-body-md'],
  [/\btext-text-body-sm\b/g, 'text-body-sm'],
  [/\btext-text-body-xs\b/g, 'text-body-xs'],
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (/\.(tsx|ts|jsx|js|css)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let changed = false;

      for (const [pattern, replacement] of REPLACEMENTS) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(SRC_DIR);
console.log('Cleanup of invalid text-text-* classes complete.');
