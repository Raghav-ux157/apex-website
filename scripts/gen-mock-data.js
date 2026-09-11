const fs = require('fs');
const products = JSON.parse(fs.readFileSync('public/data/products.json', 'utf8'));
const posts = JSON.parse(fs.readFileSync('public/data/blog.json', 'utf8'));

const js = '/* APEX Embedded Seed Data for Static / GitHub Pages Hosting */\n' +
  'window.APEX_SEED_PRODUCTS = ' + JSON.stringify(products, null, 2) + ';\n\n' +
  'window.APEX_SEED_POSTS = ' + JSON.stringify(posts, null, 2) + ';\n';

fs.writeFileSync('public/js/mock-data.js', js, 'utf8');
console.log('? Created public/js/mock-data.js with ' + products.length + ' products');
