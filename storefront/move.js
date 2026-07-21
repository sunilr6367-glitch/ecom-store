import fs from 'fs';

const homePath = 'src/styles/components/home-sections.css';
let homeCss = fs.readFileSync(homePath, 'utf8');

const blocks = {
  hero: ".hero-copy \\{[\\s\\S]*?\\.hero-dots \\{\\s*z-index: 3;\\s*\\}",
  shopNeed: "\\/\\* Shop by need \\*\\/[\\s\\S]*?\\.shop-need-media \\{[\\s\\S]*?\\.shop-need-copy p \\{[\\s\\S]*?\\}",
  sticky: "\\/\\* Sticky mobile actions \\*\\/[\\s\\S]*?\\.mobile-sticky-actions svg \\{[\\s\\S]*?\\}",
  cookie: "\\/\\* Cookie consent \\*\\/[\\s\\S]*?\\.cookie-consent-actions a \\{[\\s\\S]*?\\}",
  heroMedia: "  \\.hero-copy h1 \\{[\\s\\S]*?gap: 10px;\\s*\\}",
  stickyMedia: "  \\.mobile-sticky-actions \\{\\s*display: grid;\\s*\\}",
  shopNeedMedia: "  \\.shop-need-grid \\{[\\s\\S]*?gap: 18px;\\s*\\}"
};

function extractAndAppend(regexStr, targetFile, wrapMedia = null) {
  const regex = new RegExp(regexStr, 'g');
  const matches = homeCss.match(regex);
  if (matches && matches.length > 0) {
    let contentToAppend = "\n" + matches[0] + "\n";
    if (wrapMedia) {
      contentToAppend = "\n@media " + wrapMedia + " {\n" + matches[0] + "\n}\n";
    }
    fs.appendFileSync('src/styles/' + targetFile, contentToAppend);
    homeCss = homeCss.replace(regex, '');
  }
}

extractAndAppend(blocks.hero, 'components/reels.css');
extractAndAppend(blocks.shopNeed, 'components/category-sections.css');
extractAndAppend(blocks.sticky, 'mobile-overrides.css');
// Cookie consent is a duplicate, so just delete
homeCss = homeCss.replace(new RegExp(blocks.cookie, 'g'), '');

extractAndAppend(blocks.heroMedia, 'components/reels.css', '(max-width: 767px)');
extractAndAppend(blocks.stickyMedia, 'mobile-overrides.css', '(max-width: 767px)');
extractAndAppend(blocks.shopNeedMedia, 'components/category-sections.css', '(min-width: 768px)');

homeCss = homeCss.replace(/\\n{3,}/g, '\\n\\n');

fs.writeFileSync(homePath, homeCss);

