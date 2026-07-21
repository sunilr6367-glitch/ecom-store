const fs = require('fs');
const html = fs.readFileSync('storefront_html.txt', 'utf8');
const regex = /<img[^>]*src="([^"]+)"/g;
let match;
let i = 0;
while ((match = regex.exec(html)) !== null && i < 20) {
  console.log(match[1]);
  i++;
}
