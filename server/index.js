require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

async function startServer() {
  // 1. Initialize SQLite WASM Database
  console.log('⏳ Initializing APEX database...');
  await db.init();
  console.log('✅ SQLite Database ready');

  // 2. Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  // 3. API Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/products', require('./routes/products'));
  app.use('/api/cart', require('./routes/cart'));
  app.use('/api/wishlist', require('./routes/wishlist'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/admin', require('./routes/admin'));

  // 4. Blog routes
  app.get('/api/blog', (req, res) => {
    try {
      const posts = db.prepare('SELECT id, title, slug, excerpt, image, author, published_at FROM blog_posts ORDER BY published_at DESC').all();
      res.json(posts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/blog/:slug', (req, res) => {
    try {
      const post = db.prepare('SELECT * FROM blog_posts WHERE slug = ?').get(req.params.slug);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      res.json(post);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Clean URL routing for admin & pages
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/index.html'));
  });

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  ▲ APEX HAUTE HORLOGERIE & ATELIER — ONLINE`);
    console.log(`  Storefront:   http://localhost:${PORT}/index.html`);
    console.log(`  Catalog/Shop: http://localhost:${PORT}/shop.html`);
    console.log(`  Admin Panel:  http://localhost:${PORT}/admin/index.html`);
    console.log(`  API Products: http://localhost:${PORT}/api/products`);
    console.log(`======================================================\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
