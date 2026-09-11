const express = require('express');
const db = require('../db');
const adminMW = require('../middleware/admin');
const router = express.Router();

// GET /api/admin/stats — Dashboard KPIs
router.get('/stats', adminMW, (req, res) => {
  const totalOrders = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get().c;
  const revenue = db.prepare("SELECT COALESCE(SUM(total),0) as r FROM orders WHERE payment_status = 'paid'").get().r;
  const totalUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer'").get().c;
  const lowStock = db.prepare("SELECT COUNT(*) as c FROM products WHERE stock < 5 AND active = 1").get().c;
  const pendingReturns = db.prepare("SELECT COUNT(*) as c FROM order_returns WHERE status = 'requested'").get().c;

  // Revenue by day (last 30 days)
  const revenueChart = db.prepare(`
    SELECT date(created_at) as date, SUM(total) as revenue, COUNT(*) as orders
    FROM orders WHERE payment_status = 'paid' AND created_at >= date('now', '-30 days')
    GROUP BY date(created_at) ORDER BY date ASC
  `).all();

  // Top products
  const topProducts = db.prepare(`
    SELECT p.id, p.name, p.sku, p.price, p.stock,
           COALESCE(SUM(json_extract(oi.value, '$.quantity')), 0) as sold
    FROM products p
    LEFT JOIN orders o ON 1=1
    LEFT JOIN json_each(o.items) oi ON json_extract(oi.value, '$.product_id') = p.id
    WHERE p.active = 1
    GROUP BY p.id ORDER BY sold DESC LIMIT 5
  `).all();

  res.json({ totalOrders, pendingOrders, revenue, totalUsers, lowStock, pendingReturns, revenueChart, topProducts });
});

// GET /api/admin/orders
router.get('/orders', adminMW, (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;
  let query = 'SELECT o.*, u.name as customer_name, u.email as customer_email FROM orders o JOIN users u ON o.user_id = u.id';
  const params = [];
  if (status) { query += ' WHERE o.status = ?'; params.push(status); }
  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  const orders = db.prepare(query).all(...params).map(o => ({
    ...o, address: JSON.parse(o.address), items: JSON.parse(o.items)
  }));
  const total = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  res.json({ orders, total });
});

// PUT /api/admin/orders/:id — Update status
router.put('/orders/:id', adminMW, (req, res) => {
  const { status, payment_status, tracking_number, notes } = req.body;
  const fields = [];
  const params = [];
  if (status) { fields.push('status = ?'); params.push(status); }
  if (payment_status) { fields.push('payment_status = ?'); params.push(payment_status); }
  if (tracking_number) { fields.push('tracking_number = ?'); params.push(tracking_number); }
  if (notes) { fields.push('notes = ?'); params.push(notes); }
  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id);
  db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  res.json({ message: 'Order updated' });
});

// GET /api/admin/returns
router.get('/returns', adminMW, (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT r.*, o.total as order_total, u.name as customer_name, u.email as customer_email
    FROM order_returns r
    JOIN orders o ON r.order_id = o.id
    JOIN users u ON r.user_id = u.id
  `;
  const params = [];
  if (status) { query += ' WHERE r.status = ?'; params.push(status); }
  query += ' ORDER BY r.created_at DESC';
  const returns = db.prepare(query).all(...params);
  res.json(returns);
});

// PUT /api/admin/returns/:id — Approve/reject return
router.put('/returns/:id', adminMW, (req, res) => {
  const { status, refund_amount, restock } = req.body;
  db.prepare('UPDATE order_returns SET status = ?, refund_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, refund_amount || null, req.params.id);

  if (restock && status === 'approved') {
    const ret = db.prepare('SELECT items, order_id FROM order_returns WHERE id = ?').get(req.params.id);
    if (ret && ret.items) {
      const items = JSON.parse(ret.items);
      for (const item of items) {
        db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id);
      }
    }
  }
  res.json({ message: 'Return updated' });
});

// GET /api/admin/users — CRM Client Directory with LTV & orders count
router.get('/users', adminMW, (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.phone, u.created_at,
           COUNT(o.id) as total_orders,
           COALESCE(SUM(o.total), 0) as total_spent,
           MAX(o.created_at) as last_order_date
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.id
    ORDER BY total_spent DESC, u.created_at DESC
  `).all();
  res.json(users);
});

// GET /api/admin/users/:id — Single CRM Client Detail with order history
router.get('/users/:id', adminMW, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Client not found' });
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(user.id).map(o => ({
    ...o, address: JSON.parse(o.address), items: JSON.parse(o.items)
  }));
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ?').all(user.id);
  res.json({ user, orders, addresses });
});

// GET /api/admin/inventory — Products with stock info
router.get('/inventory', adminMW, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY stock ASC').all().map(p => ({
    ...p, images: JSON.parse(p.images), specs: JSON.parse(p.specs), tags: JSON.parse(p.tags || '[]')
  }));
  res.json(products);
});

module.exports = router;
