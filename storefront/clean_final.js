import fs from 'fs';
let css = fs.readFileSync('src/styles/components/home-sections.css', 'utf8');

css = css.replace(/\.shop-category-media\s*\{[\s\S]*?\}/g, '');
css = css.replace(/\.campaign-content\s*\{[\s\S]*?\}/g, '');
css = css.replace(/\.story-categories\s*/g, '');

// Clean up excess newlines
css = css.replace(/\n{3,}/g, '\n\n');

fs.writeFileSync('src/styles/components/home-sections.css', css);

