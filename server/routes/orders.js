const express = require('express');
const db = require('../db');
const authMW = require('../middleware/auth');
const router = express.Router();

// POST /api/orders — Place order
router.post('/', authMW, (req, res) => {
  const { address, items, subtotal, shipping, discount, total, coupon_code } = req.body;
  if (!address || !items || !total) return res.status(400).json({ error: 'Missing required fields' });

  // Validate stock for each item
  for (const item of items) {
    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(item.product_id);
    if (!product || product.stock < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for product ID ${item.product_id}` });
    }
  }

  // Create order
  const result = db.prepare(`
    INSERT INTO orders (user_id, status, payment_status, subtotal, shipping, discount, total, address, items, coupon_code)
    VALUES (?, 'pending', 'pending', ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, subtotal, shipping || 0, discount || 0, total, JSON.stringify(address), JSON.stringify(items), coupon_code || null);

  // Decrement stock
  for (const item of items) {
    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id);
  }

  // Clear cart
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);

  res.json({ order_id: result.lastInsertRowid, message: 'Order placed successfully' });
});

// GET /api/orders — User's orders
router.get('/', authMW, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id)
    .map(o => ({ ...o, address: JSON.parse(o.address), items: JSON.parse(o.items) }));
  res.json(orders);
});

// GET /api/orders/:id
router.get('/:id', authMW, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ ...order, address: JSON.parse(order.address), items: JSON.parse(order.items) });
});

// POST /api/orders/:id/return — Request return
router.post('/:id/return', authMW, (req, res) => {
  const { reason, description, items } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!['delivered', 'completed'].includes(order.status)) {
    return res.status(400).json({ error: 'Order must be delivered before requesting return' });
  }
  const result = db.prepare(`
    INSERT INTO order_returns (order_id, user_id, reason, description, items)
    VALUES (?, ?, ?, ?, ?)
  `).run(order.id, req.user.id, reason, description || null, JSON.stringify(items || []));
  res.json({ return_id: result.lastInsertRowid, message: 'Return requested' });
});

// GET /api/orders/addresses — User addresses
router.get('/me/addresses', authMW, (req, res) => {
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC').all(req.user.id);
  res.json(addresses);
});

// POST /api/orders/addresses — Add address
router.post('/me/addresses', authMW, (req, res) => {
  const { name, phone, line1, line2, city, state, pincode, is_default } = req.body;
  if (is_default) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  }
  const result = db.prepare(`
    INSERT INTO addresses (user_id, name, phone, line1, line2, city, state, pincode, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, name, phone, line1, line2 || null, city, state, pincode, is_default ? 1 : 0);
  res.json({ id: result.lastInsertRowid, message: 'Address saved' });
});

module.exports = router;
