const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/products — Public product listing with filters
router.get('/', (req, res) => {
  const { category, min, max, featured, search, sort = 'created_at', limit = 50, offset = 0 } = req.query;
  let query = 'SELECT * FROM products WHERE active = 1';
  const params = [];

  if (category) { query += ' AND category = ?'; params.push(category); }
  if (min) { query += ' AND price >= ?'; params.push(Number(min)); }
  if (max) { query += ' AND price <= ?'; params.push(Number(max)); }
  if (featured) { query += ' AND featured = 1'; }
  if (search) { query += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const sortMap = {
    'price_asc': 'price ASC',
    'price_desc': 'price DESC',
    'name': 'name ASC',
    'created_at': 'created_at DESC',
    'featured': 'featured DESC, created_at DESC'
  };
  query += ` ORDER BY ${sortMap[sort] || 'created_at DESC'} LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const products = db.prepare(query).all(...params).map(p => ({
    ...p,
    images: JSON.parse(p.images),
    specs: JSON.parse(p.specs),
    tags: JSON.parse(p.tags || '[]')
  }));

  const total = db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1').get().count;
  res.json({ products, total });
});

// GET /api/products/:slug — Single product
router.get('/:slug', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE slug = ? AND active = 1').get(req.params.slug);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(product.id);
  res.json({
    ...product,
    images: JSON.parse(product.images),
    specs: JSON.parse(product.specs),
    tags: JSON.parse(product.tags || '[]'),
    variants
  });
});

// Admin routes
const adminMW = require('../middleware/admin');

// POST /api/products — Create product
router.post('/', adminMW, (req, res) => {
  const { name, slug, sku, category, price, compare_price, stock, images, specs, description, short_desc, tags, featured } = req.body;
  const result = db.prepare(`
    INSERT INTO products (name, slug, sku, category, price, compare_price, stock, images, specs, description, short_desc, tags, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, slug, sku, category, price, compare_price || null, stock || 0,
    JSON.stringify(images || []), JSON.stringify(specs || {}), description || '', short_desc || '',
    JSON.stringify(tags || []), featured ? 1 : 0);
  res.json({ id: result.lastInsertRowid, message: 'Product created' });
});

// PUT /api/products/:id — Update product
router.put('/:id', adminMW, (req, res) => {
  const { name, slug, sku, category, price, compare_price, stock, images, specs, description, short_desc, tags, featured, active } = req.body;
  db.prepare(`
    UPDATE products SET name=?, slug=?, sku=?, category=?, price=?, compare_price=?, stock=?,
    images=?, specs=?, description=?, short_desc=?, tags=?, featured=?, active=?
    WHERE id=?
  `).run(name, slug, sku, category, price, compare_price, stock,
    JSON.stringify(images || []), JSON.stringify(specs || {}), description, short_desc,
    JSON.stringify(tags || []), featured ? 1 : 0, active !== false ? 1 : 0, req.params.id);
  res.json({ message: 'Product updated' });
});

// DELETE /api/products/:id — Soft delete (set active=0)
router.delete('/:id', adminMW, (req, res) => {
  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Product deactivated' });
});

module.exports = router;
