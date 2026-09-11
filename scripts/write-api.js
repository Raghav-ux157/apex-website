const fs = require('fs');

const code = \/* =====================================================
   APEX E-COMMERCE — HYBRID API CLIENT & OFFLINE/PAGES ENGINE
   Supports:
   1. Live Node.js Express Backend (http://localhost:3000)
   2. Zero-Backend Static Hosting (GitHub Pages / Netlify / Vercel / file://)
   ===================================================== */

const API = (() => {
  const BASE = '/api';

  // Detect if running statically (GitHub Pages, file protocol, or offline)
  const isStaticHost = 
    window.location.hostname.endsWith('github.io') ||
    window.location.protocol === 'file:' ||
    window.location.port === '5500' ||
    window.__APEX_FORCE_STATIC__ === true;

  let useMockMode = isStaticHost;

  function getToken() {
    return localStorage.getItem('apex_token');
  }

  function headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const token = getToken();
    if (token) h['Authorization'] = \\\Bearer \\\\;
    return h;
  }

  /* --------------------------------------------------
     MOCK DATA & STATE ENGINE (FOR GITHUB PAGES)
     -------------------------------------------------- */
  const MockEngine = (() => {
    function getProducts() {
      const stored = localStorage.getItem('apex_mock_products');
      if (stored) {
        try { return JSON.parse(stored); } catch(e) {}
      }
      return (window.APEX_SEED_PRODUCTS || []).map(p => ({ ...p }));
    }

    function saveProducts(prods) {
      localStorage.setItem('apex_mock_products', JSON.stringify(prods));
    }

    function getBlog() {
      return window.APEX_SEED_POSTS || [];
    }

    // Default users
    const DEFAULT_USERS = [
      { id: 1, name: 'APEX Admin', email: 'apexadmin.in', role: 'admin', phone: '+91 80000 00000' },
      { id: 2, name: 'Demo Customer', email: 'demo@apexwatches.in', role: 'customer', phone: '+91 99999 11111' },
      { id: 3, name: 'Rahul Sharma', email: 'rahul@demo.in', role: 'customer', phone: '+91 98765 43210' }
    ];

    function getUsers() {
      const stored = localStorage.getItem('apex_mock_users');
      if (stored) {
        try { return JSON.parse(stored); } catch(e) {}
      }
      return DEFAULT_USERS;
    }

    function saveUsers(users) {
      localStorage.setItem('apex_mock_users', JSON.stringify(users));
    }

    function getCurrentUser() {
      const stored = localStorage.getItem('apex_user');
      if (stored) {
        try { return JSON.parse(stored); } catch(e) {}
      }
      return null;
    }

    function getCartKey(user) {
      return 'apex_mock_cart_' + (user ? user.id : 'guest');
    }

    function getCart(user) {
      const u = user || getCurrentUser();
      const key = getCartKey(u);
      let items = [];
      const stored = localStorage.getItem(key);
      if (stored) {
        try { items = JSON.parse(stored); } catch(e) {}
      } else if (u && (u.email === 'rahul@demo.in' || u.id === 3)) {
        // Seed abandoned cart for Rahul
        items = [
          { id: 1, product_id: 1, quantity: 1 },
          { id: 2, product_id: 3, quantity: 1 },
          { id: 3, product_id: 5, quantity: 2 }
        ];
        localStorage.setItem(key, JSON.stringify(items));
      }

      // Enrich items with product details
      const products = getProducts();
      const enriched = items.map(item => {
        const p = products.find(prod => prod.id == item.product_id) || {};
        return {
          id: item.id || item.product_id,
          product_id: item.product_id,
          quantity: item.quantity,
          name: p.name || 'APEX Timepiece',
          slug: p.slug || '',
          price: p.price || 0,
          compare_price: p.compare_price,
          image: (p.images && p.images[0]) || 'img/ph-black-gold-1.svg',
          variant_name: item.variant_name || 'Atelier Standard',
          stock: p.stock || 20
        };
      });

      const subtotal = enriched.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return {
        items: enriched,
        subtotal,
        total: subtotal,
        count: enriched.reduce((sum, item) => sum + item.quantity, 0)
      };
    }

    function saveCart(user, items) {
      const u = user || getCurrentUser();
      const key = getCartKey(u);
      localStorage.setItem(key, JSON.stringify(items));
    }

    function getWishlistKey(user) {
      return 'apex_mock_wishlist_' + (user ? user.id : 'guest');
    }

    function getOrders() {
      const stored = localStorage.getItem('apex_mock_orders');
      if (stored) {
        try { return JSON.parse(stored); } catch(e) {}
      }
      const initial = [
        {
          id: 101,
          order_number: 'APX-2026-8492',
          user_id: 2,
          user_name: 'Demo Customer',
          user_email: 'demo@apexwatches.in',
          total: 9800,
          status: 'delivered',
          payment_status: 'paid',
          payment_method: 'card',
          created_at: '2026-09-08 11:30',
          shipping_address: 'Flat 402, Horizon Towers, Worli, Mumbai 400018',
          items: [
            { name: 'APEX Solaris I', price: 9800, quantity: 1, image: 'img/ph-black-gold-1.svg' }
          ]
        }
      ];
      localStorage.setItem('apex_mock_orders', JSON.stringify(initial));
      return initial;
    }

    function saveOrders(orders) {
      localStorage.setItem('apex_mock_orders', JSON.stringify(orders));
    }

    return {
      getProducts,
      saveProducts,
      getBlog,
      getUsers,
      saveUsers,
      getCurrentUser,
      getCart,
      saveCart,
      getWishlistKey,
      getOrders,
      saveOrders
    };
  })();

  /* --------------------------------------------------
     MOCK REQUEST DISPATCHER
     -------------------------------------------------- */
  async function dispatchMock(method, path, body) {
    // Artificial small delay for realistic UI responsiveness
    await new Promise(r => setTimeout(r, 60));

    const cleanPath = path.split('?')[0];
    const qs = path.includes('?') ? new URLSearchParams(path.split('?')[1]) : new URLSearchParams();

    // 1. PRODUCTS
    if (cleanPath === '/products') {
      if (method === 'GET') {
        let list = MockEngine.getProducts();
        const cat = qs.get('category');
        if (cat) list = list.filter(p => p.category && p.category.toLowerCase() === cat.toLowerCase());
        const q = qs.get('q');
        if (q) list = list.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || (p.description && p.description.toLowerCase().includes(q.toLowerCase())));
        const feat = qs.get('featured');
        if (feat) list = list.filter(p => p.featured == 1);
        return list;
      }
      if (method === 'POST') {
        const list = MockEngine.getProducts();
        const newP = { id: Date.now(), ...body, active: 1 };
        list.unshift(newP);
        MockEngine.saveProducts(list);
        return newP;
      }
    }

    const prodMatch = cleanPath.match(/^\\/products\\/(.+)$/);
    if (prodMatch) {
      const slugOrId = prodMatch[1];
      const list = MockEngine.getProducts();
      if (method === 'GET') {
        const found = list.find(p => p.slug === slugOrId || p.id == slugOrId);
        if (!found) throw new Error('Product not found');
        return found;
      }
      if (method === 'PUT') {
        const idx = list.findIndex(p => p.id == slugOrId || p.slug === slugOrId);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...body };
          MockEngine.saveProducts(list);
          return list[idx];
        }
      }
      if (method === 'DELETE') {
        const filtered = list.filter(p => p.id != slugOrId && p.slug !== slugOrId);
        MockEngine.saveProducts(filtered);
        return { success: true };
      }
    }

    // 2. AUTH
    if (cleanPath === '/auth/login' && method === 'POST') {
      const email = (body.email || '').trim().toLowerCase();
      const pwd = body.password || '';

      if ((email === 'apexadmin.in' || email === 'admin@apexadmin.in') && pwd === 'admin1234') {
        const user = { id: 1, name: 'APEX Admin', email: 'apexadmin.in', role: 'admin', phone: '+91 80000 00000' };
        localStorage.setItem('apex_user', JSON.stringify(user));
        return { token: 'mock_apex_admin_jwt', user };
      }

      if (email === 'demo@apexwatches.in' && pwd === 'demo1234') {
        const user = { id: 2, name: 'Demo Customer', email: 'demo@apexwatches.in', role: 'customer', phone: '+91 99999 11111' };
        localStorage.setItem('apex_user', JSON.stringify(user));
        return { token: 'mock_apex_demo_jwt', user };
      }

      if (email === 'rahul@demo.in' && pwd === 'demo1234') {
        const user = { id: 3, name: 'Rahul Sharma', email: 'rahul@demo.in', role: 'customer', phone: '+91 98765 43210' };
        localStorage.setItem('apex_user', JSON.stringify(user));
        return { token: 'mock_apex_rahul_jwt', user };
      }

      // Check registered users
      const users = MockEngine.getUsers();
      const found = users.find(u => u.email.toLowerCase() === email);
      if (found && (found.password === pwd || pwd === 'demo1234' || pwd.length >= 6)) {
        localStorage.setItem('apex_user', JSON.stringify(found));
        return { token: 'mock_jwt_' + found.id, user: found };
      }

      throw new Error('Invalid email or password. Please try demo@apexwatches.in (pwd: demo1234) or apexadmin.in (pwd: admin1234)');
    }

    if (cleanPath === '/auth/register' && method === 'POST') {
      const users = MockEngine.getUsers();
      const newUser = {
        id: Date.now(),
        name: body.name || 'Atelier Patron',
        email: body.email,
        phone: body.phone || '',
        role: 'customer',
        password: body.password
      };
      users.push(newUser);
      MockEngine.saveUsers(users);
      localStorage.setItem('apex_user', JSON.stringify(newUser));
      return { token: 'mock_jwt_' + newUser.id, user: newUser };
    }

    if (cleanPath === '/auth/me') {
      const u = MockEngine.getCurrentUser();
      if (!u) throw new Error('Not authenticated');
      if (method === 'GET') return u;
      if (method === 'PUT') {
        const updated = { ...u, ...body };
        localStorage.setItem('apex_user', JSON.stringify(updated));
        return updated;
      }
    }

    // 3. CART
    if (cleanPath === '/cart') {
      if (method === 'GET') return MockEngine.getCart();
      if (method === 'POST') {
        const cartObj = MockEngine.getCart();
        let items = cartObj.items.map(i => ({ id: i.id, product_id: i.product_id, quantity: i.quantity }));
        const existing = items.find(i => i.product_id == body.product_id);
        if (existing) {
          existing.quantity += Number(body.quantity || 1);
        } else {
          items.push({
            id: Date.now(),
            product_id: body.product_id,
            quantity: Number(body.quantity || 1)
          });
        }
        MockEngine.saveCart(null, items);
        return MockEngine.getCart();
      }
      if (method === 'DELETE') {
        MockEngine.saveCart(null, []);
        return { items: [], total: 0, count: 0 };
      }
    }

    const cartItemMatch = cleanPath.match(/^\\/cart\\/(.+)$/);
    if (cartItemMatch) {
      const itemId = cartItemMatch[1];
      const cartObj = MockEngine.getCart();
      let items = cartObj.items.map(i => ({ id: i.id, product_id: i.product_id, quantity: i.quantity }));

      if (method === 'PUT') {
        const item = items.find(i => i.id == itemId || i.product_id == itemId);
        if (item) item.quantity = Number(body.quantity || 1);
        items = items.filter(i => i.quantity > 0);
        MockEngine.saveCart(null, items);
        return MockEngine.getCart();
      }
      if (method === 'DELETE') {
        items = items.filter(i => i.id != itemId && i.product_id != itemId);
        MockEngine.saveCart(null, items);
        return MockEngine.getCart();
      }
    }

    // 4. WISHLIST
    if (cleanPath === '/wishlist') {
      const u = MockEngine.getCurrentUser();
      const key = MockEngine.getWishlistKey(u);
      if (method === 'GET') {
        const raw = localStorage.getItem(key);
        const ids = raw ? JSON.parse(raw) : [];
        const prods = MockEngine.getProducts().filter(p => ids.includes(p.id));
        return prods;
      }
      if (method === 'POST') {
        const raw = localStorage.getItem(key);
        let ids = raw ? JSON.parse(raw) : [];
        if (!ids.includes(Number(body.product_id))) ids.push(Number(body.product_id));
        localStorage.setItem(key, JSON.stringify(ids));
        return { success: true };
      }
    }

    const wishMatch = cleanPath.match(/^\\/wishlist\\/(.+)$/);
    if (wishMatch && method === 'DELETE') {
      const pid = Number(wishMatch[1]);
      const u = MockEngine.getCurrentUser();
      const key = MockEngine.getWishlistKey(u);
      const raw = localStorage.getItem(key);
      let ids = raw ? JSON.parse(raw) : [];
      ids = ids.filter(id => id !== pid);
      localStorage.setItem(key, JSON.stringify(ids));
      return { success: true };
    }

    // 5. ORDERS
    if (cleanPath === '/orders') {
      const orders = MockEngine.getOrders();
      if (method === 'GET') {
        const u = MockEngine.getCurrentUser();
        if (!u) return [];
        if (u.role === 'admin') return orders;
        return orders.filter(o => o.user_id == u.id || o.user_email === u.email);
      }
      if (method === 'POST') {
        const u = MockEngine.getCurrentUser();
        const cart = MockEngine.getCart(u);
        const randNum = Math.floor(1000 + Math.random() * 9000);
        const newOrder = {
          id: Date.now(),
          order_number: 'APX-2026-' + randNum,
          user_id: u ? u.id : null,
          user_name: body.shipping?.name || (u ? u.name : 'Guest Client'),
          user_email: body.shipping?.email || (u ? u.email : 'guest@apexwatches.in'),
          total: cart.total || body.total || 9800,
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: body.payment_method || 'card',
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
          shipping_address: body.shipping ? \\\\, \ \\\\ : 'Atelier Direct',
          items: cart.items.length ? cart.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity, image: i.image })) : [
            { name: 'APEX Solaris I', price: 9800, quantity: 1, image: 'img/ph-black-gold-1.svg' }
          ]
        };
        orders.unshift(newOrder);
        MockEngine.saveOrders(orders);
        // Clear cart
        MockEngine.saveCart(u, []);
        return newOrder;
      }
    }

    const orderDetailMatch = cleanPath.match(/^\\/orders\\/(\\d+)$/);
    if (orderDetailMatch && method === 'GET') {
      const id = orderDetailMatch[1];
      const orders = MockEngine.getOrders();
      const found = orders.find(o => o.id == id || o.order_number === id);
      if (!found) throw new Error('Order not found');
      return found;
    }

    const returnMatch = cleanPath.match(/^\\/orders\\/(\\d+)\\/return$/);
    if (returnMatch && method === 'POST') {
      const id = returnMatch[1];
      const orders = MockEngine.getOrders();
      const o = orders.find(order => order.id == id);
      if (o) o.status = 'return_requested';
      MockEngine.saveOrders(orders);
      return { success: true, message: 'Return initiated for Atelier inspection' };
    }

    // 6. ADMIN
    if (cleanPath === '/admin/stats') {
      const orders = MockEngine.getOrders();
      const products = MockEngine.getProducts();
      const users = MockEngine.getUsers();
      const rev = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
      return {
        revenue: rev,
        orders_count: orders.length,
        clients_count: users.length,
        low_stock_count: products.filter(p => (p.stock || 0) < 10).length
      };
    }

    if (cleanPath === '/admin/inventory') {
      return MockEngine.getProducts();
    }

    if (cleanPath === '/admin/orders') {
      return MockEngine.getOrders();
    }

    const adminOrderUpdate = cleanPath.match(/^\\/admin\\/orders\\/(\\d+)$/);
    if (adminOrderUpdate && method === 'PUT') {
      const id = adminOrderUpdate[1];
      const orders = MockEngine.getOrders();
      const o = orders.find(ord => ord.id == id);
      if (o) {
        Object.assign(o, body);
        MockEngine.saveOrders(orders);
      }
      return o;
    }

    if (cleanPath === '/admin/returns') {
      const orders = MockEngine.getOrders();
      return orders.filter(o => o.status === 'return_requested' || o.status === 'refunded');
    }

    if (cleanPath === '/admin/users') {
      const users = MockEngine.getUsers();
      const orders = MockEngine.getOrders();
      return users.map(u => {
        const userOrders = orders.filter(o => o.user_id == u.id || o.user_email === u.email);
        const spent = userOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone || '+91 90000 00000',
          total_orders: userOrders.length,
          total_spent: spent,
          last_order_date: userOrders[0] ? userOrders[0].created_at : null
        };
      });
    }

    const adminUserDossier = cleanPath.match(/^\\/admin\\/users\\/(\\d+)$/);
    if (adminUserDossier) {
      const id = adminUserDossier[1];
      const users = MockEngine.getUsers();
      const u = users.find(user => user.id == id);
      if (!u) throw new Error('User not found');
      const orders = MockEngine.getOrders().filter(o => o.user_id == id || o.user_email === u.email);
      return {
        ...u,
        orders,
        total_spent: orders.reduce((s, o) => s + (Number(o.total) || 0), 0),
        total_orders: orders.length
      };
    }

    // 7. BLOG
    if (cleanPath === '/blog') {
      return MockEngine.getBlog();
    }
    const blogMatch = cleanPath.match(/^\\/blog\\/(.+)$/);
    if (blogMatch) {
      const post = MockEngine.getBlog().find(p => p.slug === blogMatch[1]);
      if (!post) throw new Error('Article not found');
      return post;
    }

    console.warn('[APEX Mock] Unhandled route:', method, path);
    return {};
  }

  /* --------------------------------------------------
     MAIN REQUEST HANDLER (REAL BACKEND WITH AUTO-FALLBACK)
     -------------------------------------------------- */
  async function request(method, path, body) {
    if (useMockMode) {
      return dispatchMock(method, path, body);
    }

    const opts = { method, headers: headers() };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(BASE + path, opts);
      if (res.status === 404) {
        // Backend not serving this API endpoint or running statically: switch to mock
        console.info('[APEX] Route 404, falling back to static client engine:', path);
        useMockMode = true;
        return dispatchMock(method, path, body);
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || \\\HTTP \\\\);
      return data;
    } catch (err) {
      // If network fails (e.g. static hosting on GitHub Pages where /api does not exist)
      console.info('[APEX] Live backend offline, activating static client engine for:', path);
      useMockMode = true;
      return dispatchMock(method, path, body);
    }
  }

  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    del: (path) => request('DELETE', path),

    // Auth
    auth: {
      login: (email, password) => request('POST', '/auth/login', { email, password }),
      register: (name, email, password, phone) => request('POST', '/auth/register', { name, email, password, phone }),
      me: () => request('GET', '/auth/me'),
      updateMe: (data) => request('PUT', '/auth/me', data),
    },

    // Products
    products: {
      list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request('GET', \\\/products\\\\);
      },
      get: (slug) => request('GET', \\\/products/\\\\),
      create: (data) => request('POST', '/products', data),
      update: (id, data) => request('PUT', \\\/products/\\\\, data),
      delete: (id) => request('DELETE', \\\/products/\\\\),
    },

    // Cart
    cart: {
      get: () => request('GET', '/cart'),
      add: (product_id, variant_id, quantity) => request('POST', '/cart', { product_id, variant_id, quantity }),
      update: (itemId, quantity) => request('PUT', \\\/cart/\\\\, { quantity }),
      remove: (itemId) => request('DELETE', \\\/cart/\\\\),
      clear: () => request('DELETE', '/cart'),
    },

    // Wishlist
    wishlist: {
      get: () => request('GET', '/wishlist'),
      add: (product_id) => request('POST', '/wishlist', { product_id }),
      remove: (productId) => request('DELETE', \\\/wishlist/\\\\),
    },

    // Orders
    orders: {
      list: () => request('GET', '/orders'),
      get: (id) => request('GET', \\\/orders/\\\\),
      place: (data) => request('POST', '/orders', data),
      requestReturn: (orderId, data) => request('POST', \\\/orders/\/return\\\, data),
    },

    // Admin
    admin: {
      stats: () => request('GET', '/admin/stats'),
      orders: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request('GET', \\\/admin/orders\\\\);
      },
      updateOrder: (id, data) => request('PUT', \\\/admin/orders/\\\\, data),
      returns: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request('GET', \\\/admin/returns\\\\);
      },
      updateReturn: (id, data) => request('PUT', \\\/admin/returns/\\\\, data),
      inventory: () => request('GET', '/admin/inventory'),
      users: () => request('GET', '/admin/users'),
      getUser: (id) => request('GET', \\\/admin/users/\\\\),
    },

    // Blog
    blog: {
      list: () => request('GET', '/blog'),
      get: (slug) => request('GET', \\\/blog/\\\\),
    },
  };
})();

window.API = API;
\;

fs.writeFileSync('public/js/api.js', code, 'utf8');
console.log('? Upgraded public/js/api.js with hybrid online/offline GitHub Pages engine');
