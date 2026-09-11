const express = require('express');
const db = require('../db');
const authMW = require('../middleware/auth');
const router = express.Router();

// GET /api/cart
router.get('/', authMW, (req, res) => {
  const items = db.prepare(`
    SELECT ci.id, ci.quantity, ci.product_id, ci.variant_id,
           p.name, p.slug, p.price, p.images, p.stock,
           pv.name as variant_name, pv.price_delta
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.user_id = ?
  `).all(req.user.id).map(i => ({
    ...i,
    images: JSON.parse(i.images),
    effectivePrice: i.price + (i.price_delta || 0)
  }));
  const total = items.reduce((s, i) => s + i.effectivePrice * i.quantity, 0);
  res.json({ items, total });
});

// POST /api/cart — Add or increment
router.post('/', authMW, (req, res) => {
  const { product_id, variant_id = null, quantity = 1 } = req.body;
  const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id=? AND product_id=? AND variant_id IS ?').get(req.user.id, product_id, variant_id);
  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, variant_id, quantity) VALUES (?,?,?,?)').run(req.user.id, product_id, variant_id, quantity);
  }
  res.json({ message: 'Added to cart' });
});

// PUT /api/cart/:itemId — Update quantity
router.put('/:itemId', authMW, (req, res) => {
  const { quantity } = req.body;
  if (quantity < 1) {
    db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.itemId, req.user.id);
  } else {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?').run(quantity, req.params.itemId, req.user.id);
  }
  res.json({ message: 'Cart updated' });
});

// DELETE /api/cart/:itemId
router.delete('/:itemId', authMW, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.itemId, req.user.id);
  res.json({ message: 'Item removed' });
});

// DELETE /api/cart — Clear cart
router.delete('/', authMW, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Cart cleared' });
});

module.exports = router;
