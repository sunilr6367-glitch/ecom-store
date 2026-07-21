import fs from 'fs';
const css = fs.readFileSync('src/styles/components/home-sections.css', 'utf8');

const patternsToExtract = [
  /(\/\* Homepage hero \*\/[\s\S]*?(?=\/\* Mobile story categories))/g,
  /(\/\* Shop by need \*\/[\s\S]*?(?=\/\* Mobile sticky actions \*\/))/g,
  /(\/\* Mobile sticky actions \*\/[\s\S]*?(?=\/\* Cookie consent \*\/))/g,
  /(\/\* Cookie consent \*\/[\s\S]*?(?=\/\* Campaign and seasonal \*\/))/g
];

patternsToExtract.forEach((p, i) => {
  const match = css.match(p);
  if (match) {
    fs.writeFileSync('block_' + i + '.css', match[0]);
  }
});

