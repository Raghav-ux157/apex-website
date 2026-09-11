const fs = require('fs');
const path = require('path');

const publicDir = path.resolve('public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

let modifiedCount = 0;

for (const file of files) {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content
    .replace(/href="\/index\.html"/g, 'href="index.html"')
    .replace(/href="\/shop\.html/g, 'href="shop.html')
    .replace(/href="\/about\.html"/g, 'href="about.html"')
    .replace(/href="\/journal\.html"/g, 'href="journal.html"')
    .replace(/href="\/contact\.html"/g, 'href="contact.html"')
    .replace(/href="\/cart\.html"/g, 'href="cart.html"')
    .replace(/href="\/checkout\.html"/g, 'href="checkout.html"')
    .replace(/href="\/wishlist\.html"/g, 'href="wishlist.html"')
    .replace(/href="\/account\.html/g, 'href="account.html')
    .replace(/href="\/faq\.html/g, 'href="faq.html')
    .replace(/href="\/shipping\.html/g, 'href="shipping.html')
    .replace(/href="\/product\.html/g, 'href="product.html')
    .replace(/href="\/admin\//g, 'href="admin/');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    console.log('Updated links in public/' + file);
  }
}

// Update admin files
const adminDir = path.join(publicDir, 'admin');
if (fs.existsSync(adminDir)) {
  const adminFiles = fs.readdirSync(adminDir).filter(f => f.endsWith('.html'));
  for (const file of adminFiles) {
    const filePath = path.join(adminDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    content = content
      .replace(/href="\/index\.html"/g, 'href="../index.html"')
      .replace(/href="\/admin\/index\.html"/g, 'href="index.html"')
      .replace(/href="\/admin\/inventory\.html"/g, 'href="inventory.html"')
      .replace(/href="\/admin\/orders\.html"/g, 'href="orders.html"')
      .replace(/href="\/admin\/returns\.html"/g, 'href="returns.html"')
      .replace(/href="\/admin\/clients\.html"/g, 'href="clients.html"');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated links in public/admin/' + file);
    }
  }
}

// Also update public/js/store.js
const storeJsPath = path.join(publicDir, 'js', 'store.js');
if (fs.existsSync(storeJsPath)) {
  let s = fs.readFileSync(storeJsPath, 'utf8');
  s = s
    .replace(/href="\/product\.html/g, 'href="product.html')
    .replace(/href="\/checkout\.html"/g, 'href="checkout.html"')
    .replace(/href="\/cart\.html"/g, 'href="cart.html"')
    .replace(/href="\/shop\.html"/g, 'href="shop.html"');
  fs.writeFileSync(storeJsPath, s, 'utf8');
  console.log('Updated links in public/js/store.js');
}

console.log('All links updated cleanly.');
