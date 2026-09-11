const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, '../apex.db');

let sqlDb = null;
let SQL = null;
let initialized = false;

// Persist SQLite database to disk
function saveToDisk() {
  if (!sqlDb) return;
  try {
    const data = sqlDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (err) {
    console.error('[DB] Error saving to disk:', err.message);
  }
}

async function init() {
  if (initialized && sqlDb) return sqlDb;
  SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  // Create tables if not exists
  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      line1 TEXT NOT NULL,
      line2 TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      compare_price INTEGER,
      stock INTEGER NOT NULL DEFAULT 0,
      images TEXT NOT NULL DEFAULT '[]',
      specs TEXT NOT NULL DEFAULT '{}',
      description TEXT,
      short_desc TEXT,
      tags TEXT DEFAULT '[]',
      active INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      price_delta INTEGER DEFAULT 0,
      attributes TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      UNIQUE(user_id, product_id, variant_id)
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      subtotal INTEGER NOT NULL,
      shipping INTEGER NOT NULL DEFAULT 0,
      discount INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL,
      address TEXT NOT NULL,
      items TEXT NOT NULL,
      coupon_code TEXT,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      tracking_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'requested',
      items TEXT,
      refund_amount INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT,
      content TEXT,
      image TEXT,
      author TEXT DEFAULT 'APEX Editorial',
      category TEXT DEFAULT 'journal',
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  saveToDisk();
  initialized = true;
  return sqlDb;
}

// Convert params to array if passed as rest
function normalizeParams(args) {
  if (args.length === 1 && Array.isArray(args[0])) return args[0];
  return args.map(arg => (arg === undefined ? null : arg));
}

// Emulate better-sqlite3 API
const dbWrapper = {
  init,
  saveToDisk,
  pragma: (str) => {
    if (sqlDb) sqlDb.run(`PRAGMA ${str}`);
  },
  exec: (sql) => {
    if (!sqlDb) throw new Error('Database not initialized. Call await db.init()');
    sqlDb.run(sql);
    saveToDisk();
  },
  prepare: (sql) => {
    if (!sqlDb) throw new Error('Database not initialized. Call await db.init()');

    return {
      all: (...params) => {
        const p = normalizeParams(params);
        try {
          const stmt = sqlDb.prepare(sql);
          if (p.length > 0) stmt.bind(p);
          const results = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        } catch (err) {
          console.error(`[DB Query Error] ${sql}:`, err.message);
          throw err;
        }
      },
      get: (...params) => {
        const p = normalizeParams(params);
        try {
          const stmt = sqlDb.prepare(sql);
          if (p.length > 0) stmt.bind(p);
          let result = undefined;
          if (stmt.step()) {
            result = stmt.getAsObject();
          }
          stmt.free();
          return result;
        } catch (err) {
          console.error(`[DB Query Error] ${sql}:`, err.message);
          throw err;
        }
      },
      run: (...params) => {
        const p = normalizeParams(params);
        try {
          sqlDb.run(sql, p);
          const idRes = sqlDb.exec('SELECT last_insert_rowid() as id');
          const lastInsertRowid = (idRes.length > 0 && idRes[0].values.length > 0) ? idRes[0].values[0][0] : 0;
          saveToDisk();
          return { lastInsertRowid, changes: 1 };
        } catch (err) {
          console.error(`[DB Run Error] ${sql}:`, err.message);
          throw err;
        }
      }
    };
  }
};

module.exports = dbWrapper;
