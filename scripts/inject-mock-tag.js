const fs = require('fs');
const path = require('path');

const publicDir = path.resolve('public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const p = path.join(publicDir, file);
  let content = fs.readFileSync(p, 'utf8');
  if (!content.includes('mock-data.js') && content.includes('src=\"js/api.js\"')) {
    content = content.replace('src=\"js/api.js\"', 'src=\"js/mock-data.js\"></script>\n  <script src=\"js/api.js\"');
    fs.writeFileSync(p, content, 'utf8');
    console.log('Injected mock-data.js into ' + file);
  }
}

const adminDir = path.join(publicDir, 'admin');
const adminFiles = fs.readdirSync(adminDir).filter(f => f.endsWith('.html'));
for (const file of adminFiles) {
  const p = path.join(adminDir, file);
  let content = fs.readFileSync(p, 'utf8');
  if (!content.includes('mock-data.js') && content.includes('src=\"../js/api.js\"')) {
    content = content.replace('src=\"../js/api.js\"', 'src=\"../js/mock-data.js\"></script>\n  <script src=\"../js/api.js\"');
    fs.writeFileSync(p, content, 'utf8');
    console.log('Injected mock-data.js into admin/' + file);
  }
}
