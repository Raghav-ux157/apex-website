const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'apex_secret_key_2024';

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)').run(name, email, hash, phone || null);
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user, token });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const trimmedEmail = (email || '').trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ? OR (role = "admin" AND (? = "apexadmin.in" OR ? = "admin@apexadmin.in"))')
    .get(trimmedEmail, trimmedEmail, trimmedEmail);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { password_hash, ...safeUser } = user;
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: safeUser, token });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?').get(decoded.id);
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// PUT /api/auth/me — Update profile
router.put('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    const { name, phone } = req.body;
    db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(name, phone, decoded.id);
    const user = db.prepare('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?').get(decoded.id);
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
