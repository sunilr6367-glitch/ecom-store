import fs from 'fs';

let css = fs.readFileSync('src/styles/components/home-sections.css', 'utf8');

// Fix dangling .mobile-circle-categories,
css = css.replace(/\.mobile-circle-categories,[\s\S]*?(?=\s*\.shop-need-grid|\})/g, '');
// Also remove dangling hero media queries that were empty 
css = css.replace(/@media \(min-width: \d+px\) \{\s*\}/g, '');

fs.writeFileSync('src/styles/components/home-sections.css', css);

