// APEX Database Seed — 12 premium watches + admin user + blog posts
const db = require('../server/db');
const bcrypt = require('bcryptjs');

async function seed() {
  await db.init();
  console.log('🌱 Seeding APEX database...');

// Admin user
const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
if (!adminExists) {
  db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
    .run('APEX Admin', 'apexadmin.in', bcrypt.hashSync('admin1234', 10));
  console.log('✅ Admin created: apexadmin.in / admin1234');
} else {
  db.prepare("UPDATE users SET email = ?, password_hash = ? WHERE role = 'admin'")
    .run('apexadmin.in', bcrypt.hashSync('admin1234', 10));
  console.log('✅ Admin updated: apexadmin.in / admin1234');
}

// Demo customer
const demoExists = db.prepare("SELECT id FROM users WHERE email = 'demo@apexwatches.in'").get();
if (!demoExists) {
  db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')")
    .run('Demo Customer', 'demo@apexwatches.in', bcrypt.hashSync('demo1234', 10));
  console.log('✅ Demo user created: demo@apexwatches.in / demo1234');
}

// Abandoned-cart demo customer (Rahul Sharma)
const rahulExists = db.prepare("SELECT id FROM users WHERE email = 'rahul@demo.in'").get();
let rahulId;
if (!rahulExists) {
  const r = db.prepare("INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, 'customer', ?)")
    .run('Rahul Sharma', 'rahul@demo.in', bcrypt.hashSync('demo1234', 10), '+91 9876543210');
  rahulId = r.lastInsertRowid;
  console.log('✅ Abandoned-cart demo created: rahul@demo.in / demo1234');
} else {
  rahulId = rahulExists.id;
}
// Ensure cart items exist for Rahul (products 1, 3, 5)
for (const [pid, qty] of [[1,1],[3,1],[5,2]]) {
  db.prepare('INSERT OR IGNORE INTO cart_items (user_id, product_id, variant_id, quantity) VALUES (?, ?, NULL, ?)')
    .run(rahulId, pid, qty);
}

// Watch placeholder images (using CSS-rendered canvas placeholders)
const PLACEHOLDER = {
  black_gold: ['img/ph-black-gold-1.svg', 'img/ph-black-gold-2.svg'],
  silver_blue: ['img/ph-silver-blue-1.svg', 'img/ph-silver-blue-2.svg'],
  green: ['img/ph-green-1.svg', 'img/ph-green-2.svg'],
  rose: ['img/ph-rose-1.svg', 'img/ph-rose-2.svg'],
  white_silver: ['img/ph-white-silver-1.svg', 'img/ph-white-silver-2.svg'],
  chronograph: ['img/ph-chrono-1.svg', 'img/ph-chrono-2.svg'],
  sport: ['img/ph-sport-1.svg', 'img/ph-sport-2.svg'],
  bronze: ['img/ph-bronze-1.svg', 'img/ph-bronze-2.svg'],
};

const products = [
  // ── SIGNATURE COLLECTION ──
  {
    name: 'APEX Solaris I',
    slug: 'apex-solaris-i',
    sku: 'APX-SIG-001',
    category: 'Signature',
    price: 9800,
    compare_price: 12000,
    stock: 45,
    images: PLACEHOLDER.black_gold,
    featured: 1,
    short_desc: 'Our flagship dress watch with a sunburst black dial and applied gold indices.',
    description: `The Solaris I is the cornerstone of the APEX Signature collection. Crafted for those who command a room without raising their voice, it features a 40mm stainless steel case, a deep sunburst black dial with hand-applied baton indices finished in warm gold, and a domed sapphire crystal with anti-reflective coating. The Miyota 9015 automatic movement delivers 42-hour power reserve and accurate timekeeping.`,
    specs: {
      'Case Diameter': '40mm',
      'Case Material': '316L Stainless Steel — PVD Black',
      'Crystal': 'Sapphire, Double AR Coating',
      'Movement': 'Miyota 9015 Automatic',
      'Power Reserve': '42 hours',
      'Water Resistance': '5 ATM',
      'Strap': 'Full-Grain Italian Leather, 20mm',
      'Lug Width': '20mm',
      'Dial Colour': 'Sunburst Black',
      'Indices': 'Applied Gold-Plated Batons',
    },
    tags: ['automatic', 'dress', 'leather', 'bestseller'],
  },
  {
    name: 'APEX Solaris II',
    slug: 'apex-solaris-ii',
    sku: 'APX-SIG-002',
    category: 'Signature',
    price: 9400,
    compare_price: null,
    stock: 30,
    images: PLACEHOLDER.silver_blue,
    featured: 1,
    short_desc: 'Silver case, slate blue guilloche dial — understated authority.',
    description: `Solaris II evolves the flagship with a silver-tone 316L case and a mesmerising slate-blue guilloché dial produced by a precision engine-turning CNC process. Paired with a five-link steel bracelet with push-button deployant clasp, it reads as effortlessly premium at ₹9,400.`,
    specs: {
      'Case Diameter': '40mm',
      'Case Material': '316L Stainless Steel — Polished/Brushed',
      'Crystal': 'Sapphire, AR Coating',
      'Movement': 'Miyota 9015 Automatic',
      'Power Reserve': '42 hours',
      'Water Resistance': '5 ATM',
      'Bracelet': 'Five-Link Steel, Push-Button Deployant',
      'Lug Width': '20mm',
      'Dial Colour': 'Slate Blue Guilloché',
      'Indices': 'Applied Silver-Plated Batons',
    },
    tags: ['automatic', 'dress', 'bracelet'],
  },
  {
    name: 'APEX Verdant',
    slug: 'apex-verdant',
    sku: 'APX-SIG-003',
    category: 'Signature',
    price: 8900,
    compare_price: 10500,
    stock: 22,
    images: PLACEHOLDER.green,
    featured: 0,
    short_desc: 'Forest green dial — the unexpected colour that makes every wrist unique.',
    description: `The Verdant breaks the mould with a saturated forest-green sunburst dial that shifts between deep emerald and olive in different lights. A 39mm case keeps it versatile for all wrist sizes. Delivered on a moss-green suede strap with a polished pin buckle.`,
    specs: {
      'Case Diameter': '39mm',
      'Case Material': '316L Stainless Steel — Satin Finish',
      'Crystal': 'Sapphire, AR Coating',
      'Movement': 'Miyota 8215 Automatic',
      'Power Reserve': '40 hours',
      'Water Resistance': '5 ATM',
      'Strap': 'Moss Green Italian Suede, 19mm',
      'Lug Width': '19mm',
      'Dial Colour': 'Forest Green Sunburst',
    },
    tags: ['automatic', 'dress', 'suede', 'colourful'],
  },
  // ── APEX SPORT COLLECTION ──
  {
    name: 'APEX Chronos X1',
    slug: 'apex-chronos-x1',
    sku: 'APX-SPT-001',
    category: 'Apex Sport',
    price: 9999,
    compare_price: 13000,
    stock: 18,
    images: PLACEHOLDER.chronograph,
    featured: 1,
    short_desc: 'Bold tri-register chronograph. 12-hour elapsed time, 100m water resistance.',
    description: `The Chronos X1 is APEX's high-performance chronograph — engineered for precision in motion. The 43mm black-PVD case houses a Seagull ST1901 mechanical column-wheel chronograph movement with 3 registers: running seconds, 30-minute counter, and 12-hour counter. A unidirectional aluminium bezel and 100m water resistance complete the sport pedigree.`,
    specs: {
      'Case Diameter': '43mm',
      'Case Material': '316L Stainless Steel — PVD Black',
      'Bezel': 'Unidirectional Aluminium Insert',
      'Crystal': 'Sapphire, AR Coating',
      'Movement': 'Seagull ST1901 Manual Chronograph',
      'Power Reserve': '45 hours',
      'Water Resistance': '10 ATM (100m)',
      'Strap': 'Black Vulcanised Rubber + Deployant, 22mm',
      'Lug Width': '22mm',
      'Dial Colour': 'Matte Black with Gold Accents',
    },
    tags: ['chronograph', 'sport', 'rubber', 'flagship'],
  },
  {
    name: 'APEX Terra Diver',
    slug: 'apex-terra-diver',
    sku: 'APX-SPT-002',
    category: 'Apex Sport',
    price: 8500,
    compare_price: null,
    stock: 35,
    images: PLACEHOLDER.sport,
    featured: 0,
    short_desc: '200m dive-ready sports watch with luminous indices and screw-down crown.',
    description: `Built for the deep. The Terra Diver meets ISO 6425 dive watch standards with a 200m water resistance rating, screw-down crown, and unidirectional 120-click bezel. Super-LumiNova C1 on all indices and hands ensures legibility in zero-light conditions. The case sits at 42mm with an oyster-style bracelet.`,
    specs: {
      'Case Diameter': '42mm',
      'Case Material': '316L Stainless Steel — Brushed',
      'Bezel': 'Unidirectional 120-Click Aluminium',
      'Crystal': 'Sapphire, Anti-Reflective',
      'Movement': 'Miyota 8215 Automatic',
      'Power Reserve': '40 hours',
      'Water Resistance': '20 ATM (200m)',
      'Crown': 'Screw-Down',
      'Bracelet': 'Oyster-Style with Wet Suit Extension',
      'Luminous': 'Super-LumiNova C1',
    },
    tags: ['sport', 'diver', 'automatic', 'bracelet', 'luminous'],
  },
  {
    name: 'APEX Veloce GMT',
    slug: 'apex-veloce-gmt',
    sku: 'APX-SPT-003',
    category: 'Apex Sport',
    price: 9200,
    compare_price: 11000,
    stock: 12,
    images: PLACEHOLDER.silver_blue,
    featured: 1,
    short_desc: 'Dual-timezone GMT complication — track two time zones with one glance.',
    description: `For the frequent traveller, the Veloce GMT adds a red-and-blue GMT hand and a 24-hour graduated bezel to simultaneously display home and local time. The 41mm case in polished/brushed two-tone finish pairs with a leather NATO strap for a versatile dress-sport character.`,
    specs: {
      'Case Diameter': '41mm',
      'Case Material': '316L Stainless Steel — Two-Tone Finish',
      'Bezel': '24-hour Bi-Directional, Stainless Steel',
      'Crystal': 'Sapphire, Double Dome AR',
      'Movement': 'Miyota 9075 GMT Automatic',
      'Power Reserve': '42 hours',
      'Water Resistance': '10 ATM',
      'Strap': 'Navy/Red Leather NATO, 20mm',
      'Complication': 'GMT Second Time Zone',
    },
    tags: ['gmt', 'travel', 'automatic', 'nato'],
  },
  // ── MERIDIAN COLLECTION ──
  {
    name: 'APEX Meridian Slim',
    slug: 'apex-meridian-slim',
    sku: 'APX-MER-001',
    category: 'Meridian',
    price: 5499,
    compare_price: 7000,
    stock: 60,
    images: PLACEHOLDER.white_silver,
    featured: 0,
    short_desc: 'Ultra-thin 7.8mm case profile. The everyday modern classic.',
    description: `At just 7.8mm thin, the Meridian Slim is the watch you forget you're wearing — until someone notices it. A clean white dial with printed Roman numerals, a polished stainless steel case at 38mm, and a cognac leather strap make it perfect for office, date, and everything in between. Powered by a slim quartz movement for pinpoint accuracy.`,
    specs: {
      'Case Diameter': '38mm',
      'Case Thickness': '7.8mm',
      'Case Material': '316L Stainless Steel — Polished',
      'Crystal': 'Mineral, AR Coating',
      'Movement': 'Miyota 2025 Quartz',
      'Battery Life': '3+ years',
      'Water Resistance': '3 ATM',
      'Strap': 'Cognac Full-Grain Calf Leather, 20mm',
      'Dial Colour': 'Opaline White',
    },
    tags: ['quartz', 'slim', 'everyday', 'value'],
  },
  {
    name: 'APEX Meridian Sport',
    slug: 'apex-meridian-sport',
    sku: 'APX-MER-002',
    category: 'Meridian',
    price: 6200,
    compare_price: null,
    stock: 50,
    images: PLACEHOLDER.sport,
    featured: 0,
    short_desc: 'Sporty three-hand with date window — the versatile daily driver.',
    description: `The Meridian Sport bridges the gap between the office and the gym. A 40mm stainless steel case with a brushed centre and polished chamfers, date window at 3 o'clock, and 10 ATM water resistance make it the most capable everyday watch in the APEX range. Available on integrated rubber or steel bracelet.`,
    specs: {
      'Case Diameter': '40mm',
      'Case Material': '316L Stainless Steel — Brushed/Polished',
      'Crystal': 'Sapphire-Coated Mineral',
      'Movement': 'Miyota 8205 Automatic with Date',
      'Power Reserve': '40 hours',
      'Water Resistance': '10 ATM',
      'Strap Options': 'Black Rubber / Steel Bracelet',
      'Lug Width': '20mm',
    },
    tags: ['automatic', 'date', 'sport', 'versatile'],
  },
  {
    name: 'APEX Meridian Rose',
    slug: 'apex-meridian-rose',
    sku: 'APX-MER-003',
    category: 'Meridian',
    price: 5999,
    compare_price: 7500,
    stock: 40,
    images: PLACEHOLDER.rose,
    featured: 0,
    short_desc: 'Rose gold tone case, blush pink dial — refined minimalism.',
    description: `Understated femininity meets bold minimalism. The Meridian Rose features a 36mm rose gold-tone PVD case, a blush pink sunburst dial with diamond-cut indices, and a blush pink leather strap with white stitching. This is APEX's statement unisex piece for those who appreciate softer palettes.`,
    specs: {
      'Case Diameter': '36mm',
      'Case Material': '316L Stainless Steel — Rose Gold PVD',
      'Crystal': 'Mineral, AR Coating',
      'Movement': 'Miyota 2025 Quartz',
      'Battery Life': '3+ years',
      'Water Resistance': '3 ATM',
      'Strap': 'Blush Pink Calf Leather, 18mm',
      'Dial Colour': 'Blush Pink Sunburst',
    },
    tags: ['quartz', 'rose-gold', 'minimalist', 'unisex'],
  },
  // ── HERITAGE COLLECTION ──
  {
    name: 'APEX Archival 1973',
    slug: 'apex-archival-1973',
    sku: 'APX-HER-001',
    category: 'Heritage',
    price: 8200,
    compare_price: 10000,
    stock: 15,
    images: PLACEHOLDER.bronze,
    featured: 1,
    short_desc: 'Vintage-inspired cushion case with fauxtina dial — aged elegance.',
    description: `The Archival 1973 is a love letter to classic watchmaking. Its 38mm cushion-shaped case is finished in a warm bronze-tone PVD, paired with a cream "fauxtina" dial that mimics the aged patina of a 1970s dress watch. A domed crystal, cathedral hands, and a tan vintage-distressed leather strap complete the ensemble.`,
    specs: {
      'Case Diameter': '38mm (Cushion)',
      'Case Material': '316L Stainless Steel — Bronze PVD',
      'Crystal': 'Domed Sapphire, AR Coating',
      'Movement': 'Miyota 8215 Automatic',
      'Power Reserve': '40 hours',
      'Water Resistance': '5 ATM',
      'Strap': 'Distressed Tan Leather, 20mm',
      'Dial Colour': 'Cream "Fauxtina"',
      'Hands': 'Cathedral Luminous',
    },
    tags: ['automatic', 'vintage', 'bronze', 'heritage'],
  },
  {
    name: 'APEX Archival Moonphase',
    slug: 'apex-archival-moonphase',
    sku: 'APX-HER-002',
    category: 'Heritage',
    price: 9600,
    compare_price: null,
    stock: 10,
    images: PLACEHOLDER.silver_blue,
    featured: 1,
    short_desc: 'Romantic moonphase complication in a vintage silver cushion case.',
    description: `The Archival Moonphase adds a romantic complication to Heritage sensibilities. The starry-night moonphase indicator at 6 o'clock is hand-painted and accurate to one day in 122 years. A silver-tone 40mm cushion case and deep navy dial with silver sunray finishing make this the most artisanal piece in the APEX range.`,
    specs: {
      'Case Diameter': '40mm (Cushion)',
      'Case Material': '316L Stainless Steel — Silver PVD',
      'Crystal': 'Domed Sapphire, AR Coating',
      'Movement': 'Miyota 9132 Automatic Moonphase',
      'Power Reserve': '40 hours',
      'Water Resistance': '3 ATM',
      'Strap': 'Navy Alligator-Embossed Leather, 20mm',
      'Dial Colour': 'Deep Navy Sunray',
      'Complication': 'Moonphase at 6 o\'clock',
    },
    tags: ['automatic', 'moonphase', 'heritage', 'romantic'],
  },
  {
    name: 'APEX Archival Field',
    slug: 'apex-archival-field',
    sku: 'APX-HER-003',
    category: 'Heritage',
    price: 7200,
    compare_price: 8800,
    stock: 28,
    images: PLACEHOLDER.green,
    featured: 0,
    short_desc: 'Military-inspired field watch — rugged meets refined.',
    description: `Inspired by WWII military field watches, the Archival Field strips everything back to purposeful simplicity. A matte olive dial with highly legible Arabic numerals, a sturdy 41mm steel case rated to 10 ATM, and a robust canvas NATO strap. The Miyota 8215 automatic movement keeps it ticking reliably through whatever the day brings.`,
    specs: {
      'Case Diameter': '41mm',
      'Case Material': '316L Stainless Steel — Matte Black PVD',
      'Crystal': 'Mineral, Flat AR Coating',
      'Movement': 'Miyota 8215 Automatic',
      'Power Reserve': '40 hours',
      'Water Resistance': '10 ATM',
      'Strap': 'Olive Canvas NATO, 22mm',
      'Dial Colour': 'Matte Olive',
      'Numerals': 'Arabic, Super-LumiNova',
    },
    tags: ['automatic', 'military', 'field', 'nato', 'rugged'],
  }
];

// Clear existing products and seed fresh
const existingCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
if (existingCount === 0) {
  for (const p of products) {
    db.prepare(`
      INSERT INTO products (name, slug, sku, category, price, compare_price, stock, images, specs, description, short_desc, tags, featured, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(p.name, p.slug, p.sku, p.category, p.price, p.compare_price || null, p.stock,
      JSON.stringify(p.images), JSON.stringify(p.specs), p.description, p.short_desc,
      JSON.stringify(p.tags), p.featured || 0);
  }
  console.log(`✅ ${products.length} products seeded`);
} else {
  console.log(`ℹ️  Products already seeded (${existingCount} found), skipping`);
}

// Blog posts
const blogCount = db.prepare('SELECT COUNT(*) as c FROM blog_posts').get().c;
if (blogCount === 0) {
  const posts = [
    {
      title: 'The Philosophy of Time: Why APEX Watches Are Different',
      slug: 'philosophy-of-time-apex-watches',
      excerpt: 'We believe a watch is not a status symbol — it is a daily companion. Here is why we built APEX the way we did.',
      image: 'img/blog-1.svg',
      content: `<p>At APEX, we started with a simple question: why do premium watches cost ₹5 lakhs when the components that make a watch truly great — sapphire crystal, real automatic movement, 316L steel — can be sourced for a fraction of that?</p><p>The answer is brand tax. A luxury watch charges you 90% for the name on the dial and 10% for the watch itself.</p><p>We inverted that ratio. APEX puts 85% of your money into the watch and 15% into building a brand worth wearing.</p>`,
    },
    {
      title: 'How to Read Your Watch Like a Connoisseur',
      slug: 'how-to-read-your-watch-like-a-connoisseur',
      excerpt: 'From dial finishing to movement architecture — a beginner\'s guide to watch appreciation.',
      image: 'img/blog-2.svg',
      content: `<p>The difference between a ₹500 watch and a ₹9,000 watch is rarely the movement alone. It lives in the details: the depth of the dial colour, the crispness of the applied indices, the heft of the case in hand.</p><p>In this guide, we walk you through exactly what to look for when evaluating any timepiece.</p>`,
    },
    {
      title: 'Caring for Your APEX Timepiece: A Complete Guide',
      slug: 'caring-for-your-apex-timepiece',
      excerpt: 'A well-maintained watch lasts a lifetime. Here is everything you need to know.',
      image: 'img/blog-3.svg',
      content: `<p>Your APEX watch is built to last decades. With minimal care, it will outlive every smartphone you will ever own. Here is how to keep it performing at its best.</p><h3>Cleaning</h3><p>Wipe the case monthly with a soft microfibre cloth. For the bracelet, a soft brush with mild soap and warm water works perfectly.</p><h3>Servicing</h3><p>Automatic movements should be serviced every 5–7 years. Our service centre can handle any APEX timepiece.</p>`,
    },
  ];
  for (const post of posts) {
    db.prepare('INSERT INTO blog_posts (title, slug, excerpt, content, image) VALUES (?, ?, ?, ?, ?)')
      .run(post.title, post.slug, post.excerpt, post.content, post.image);
  }
  console.log(`✅ ${posts.length} blog posts seeded`);
}

console.log('\n🎉 APEX database seed complete!\n');
console.log('   Admin login: apexadmin.in / admin1234');
console.log('   Demo login:  demo@apexwatches.in / demo1234\n');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
