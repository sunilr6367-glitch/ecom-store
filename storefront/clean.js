import fs from 'fs';

let css = fs.readFileSync('src/styles/components/home-sections.css', 'utf8');

const patterns = [
  "\\/\\* Story block \\*\\/[\\s\\S]*?\\.story-block \\{[\\s\\S]*?\\}",
  "\\.story-art \\{[\\s\\S]*?\\}",
  "\\.story-art-media \\{[\\s\\S]*?\\}",
  "\\/\\* Homepage hero \\*\\/[\\s\\S]*?\\.hero-image-scrim \\{[\\s\\S]*?\\}",
  "\\.hero-content \\{[\\s\\S]*?\\}",
  "\\.hero-proof-list \\{[\\s\\S]*?\\}",
  "\\.hero-proof-list div \\{[\\s\\S]*?\\}",
  "\\.hero-proof-list dt \\{[\\s\\S]*?\\}",
  "\\.hero-proof-list dd \\{[\\s\\S]*?\\}",
  "\\/\\* Mobile story categories \\*\\/[\\s\\S]*?\\.mobile-story-categories \\{[\\s\\S]*?\\}",
  "\\/\\* Shop category \\*\\/[\\s\\S]*?\\.shop-category-section \\{[\\s\\S]*?\\}",
  "\\.shop-category-grid \\{[\\s\\S]*?\\}",
  "\\.shop-category-card \\{[\\s\\S]*?\\}",
  "\\.shop-category-card span \\{[\\s\\S]*?\\}",
  "\\.shop-category-card:hover .shop-category-media,[\\s\\S]*?\\.shop-category-card:focus-visible .shop-category-media \\{[\\s\\S]*?\\}",
  "\\/\\* Campaign and seasonal \\*\\/[\\s\\S]*?\\.campaign-card \\{[\\s\\S]*?\\}",
  "\\.campaign-card:before \\{[\\s\\S]*?\\}",
  "\\/\\* Newsletter \\*\\/[\\s\\S]*?\\.newsletter-form \\{[\\s\\S]*?\\}",
  "\\/\\* Slider row \\*\\/[\\s\\S]*?\\.slider-row \\{[\\s\\S]*?\\}",
  "\\.slider-row::-webkit-scrollbar \\{[\\s\\S]*?\\}",
  "\\.slide-card \\{[\\s\\S]*?\\}",
  "\\/\\* Circle categories \\*\\/[\\s\\S]*?\\.circle-row \\{[\\s\\S]*?\\}",
  "\\.circle-row::-webkit-scrollbar \\{[\\s\\S]*?\\}",
  "\\.circle-cat \\{[\\s\\S]*?\\}",
  "\\.circle-cat-art \\{[\\s\\S]*?\\}",
  "\\.circle-cat-name \\{[\\s\\S]*?\\}",
  "  \\.mobile-story-categories \\{[\\s\\S]*?\\}",
  "  \\.mobile-circle-categories \\+ \\.hero,[\\s\\S]*?  \\.mobile-story-categories \\+ \\.hero \\{[\\s\\S]*?\\}",
  "  \\.hero-image-scrim \\{[\\s\\S]*?\\}",
  "  \\.hero-content \\{[\\s\\S]*?\\}",
  "  \\.hero-proof-list \\{[\\s\\S]*?\\}",
  "  \\.hero-proof-list div \\{[\\s\\S]*?\\}",
  "  \\.hero-proof-list dd \\{[\\s\\S]*?\\}",
  "  \\.circle-row \\{[\\s\\S]*?\\}",
  "  \\.mobile-circle-categories,[\\s\\S]*?  \\.mobile-story-categories \\{[\\s\\S]*?\\}",
  "  \\.shop-category-grid \\{[\\s\\S]*?\\}",
  "\\/\\* Trust grid \\*\\/[\\s\\S]*?\\.trust-grid \\{[\\s\\S]*?\\}",
  "\\/\\* Premium Story Categories & Instagram Section Redesign \\*\\/[\\s\\S]*?\\.story-categories \\{[\\s\\S]*?\\}",
  "\\.story-categories \\.circle-row \\{[\\s\\S]*?\\}",
  "\\.story-categories \\.circle-row::-webkit-scrollbar \\{[\\s\\S]*?\\}",
  "  \\.story-categories \\.circle-row \\{[\\s\\S]*?\\}",
  "\\/\\* Instagram Grid Section Styling \\*\\/[\\s\\S]*?\\.instagram-grid \\{[\\s\\S]*?\\}",
  "  \\.instagram-grid \\{[\\s\\S]*?\\}"
];

patterns.forEach(p => {
  css = css.replace(new RegExp(p, 'g'), '');
});

// Remove multiple newlines
css = css.replace(/\\n{3,}/g, '\\n\\n');

fs.writeFileSync('src/styles/components/home-sections.css', css);

