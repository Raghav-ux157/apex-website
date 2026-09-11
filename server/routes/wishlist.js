const express = require('express');
const db = require('../db');
const authMW = require('../middleware/auth');
const router = express.Router();

// GET /api/wishlist
router.get('/', authMW, (req, res) => {
  const items = db.prepare(`
    SELECT wi.id, wi.product_id, wi.created_at,
           p.name, p.slug, p.price, p.compare_price, p.images, p.stock
    FROM wishlist_items wi
    JOIN products p ON wi.product_id = p.id
    WHERE wi.user_id = ?
    ORDER BY wi.created_at DESC
  `).all(req.user.id).map(i => ({ ...i, images: JSON.parse(i.images) }));
  res.json(items);
});

// POST /api/wishlist
router.post('/', authMW, (req, res) => {
  const { product_id } = req.body;
  try {
    db.prepare('INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)').run(req.user.id, product_id);
    res.json({ message: 'Added to wishlist' });
  } catch {
    res.status(409).json({ error: 'Already in wishlist' });
  }
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', authMW, (req, res) => {
  db.prepare('DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.productId);
  res.json({ message: 'Removed from wishlist' });
});

module.exports = router;
