# APEX Haute Horlogerie & Atelier — Full-Stack E-Commerce Platform

A production-grade, architectural luxury wristwatch e-commerce website designed and engineered for **APEX** — an Indian custom private-label horology brand (₹5,000–₹10,000 price tier, unisex, minimalist-bold design).

---

## ⚡ Quick Start

### 1. Start Server
Run either:
```bash
npm start
```
Or double-click `start.bat` in the project root.

The platform will run at:
- **Boutique Storefront**: [http://localhost:3000](http://localhost:3000)
- **Collection / Shop**: [http://localhost:3000/shop.html](http://localhost:3000/shop.html)
- **Admin Command Portal**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🔑 Demo Access Credentials

| Account Role | Email | Password | Permissions |
|---|---|---|---|
| **Atelier Administrator** | `apexadmin.in` (or `admin@apexadmin.in`) | `admin1234` | Full access to KPI Dashboard, Inventory, Orders, RMA Returns, CRM |
| **Demo Patron Client** | `demo@apexwatches.in` | `demo1234` | Browse, Wishlist, Bag, Checkout, Order History, RMA |

---

## 🏗️ Architecture & Technology Stack

- **Backend**: Node.js, Express.js, RESTful API architecture
- **Database**: SQLite (via WebAssembly `sql.js` with pure-JS engine, zero native C++ compilation dependencies)
- **Persistence**: Database buffer automatically written to `apex.db` on disk
- **Authentication**: Stateless JSON Web Tokens (JWT) + bcrypt password hashing
- **Frontend**: Semantic HTML5, 3-tier CSS Custom Properties design system, Vanilla JS API module
- **Visuals**: Vector SVG watch illustrations, live HTML5 Canvas mechanical movement engine (8Hz escapement sweep, balance wheel, tourbillon), Web Audio API escapement synthesizer

---

## 📄 Site Map & Pages

### Customer-Facing Storefront
1. **`index.html`** — Homepage featuring the live mechanical canvas watch, bespoke configurator, sound synthesizer, and dynamic featured timepiece showcase.
2. **`shop.html`** — Complete collection browser with real-time sidebar filters by Collection (Signature, Apex Sport, Meridian, Heritage), Price bracket, Movement type, and sorting.
3. **`product.html`** — Detailed timepiece page with image gallery, horological specifications table, real-time stock allocation badges, add-to-bag, and companion pieces.
4. **`cart.html`** — Full shopping bag with line item quantity adjustments, privilege coupon discounts (`APEXFIRST` for 10% off), complimentary insured shipping calculation, and secure checkout trigger.
5. **`checkout.html`** — Multi-step checkout with delivery address capture, signature white-glove packaging selection, Razorpay / COD payment gateway simulation, and order confirmation receipt.
6. **`wishlist.html`** — Saved timepieces with one-click "Move to Bag" and instant synchronization.
7. **`account.html`** — Client portal supporting sign-in, registration, profile view, active order history with tracking, and 14-day RMA return requests.
8. **`about.html`** — Brand manifesto detailing the democratization of luxury, unisex engineering philosophy, and ₹5,000–₹10,000 positioning.
9. **`contact.html`** — Concierge inquiry form and Mumbai / Bengaluru showroom appointment details.
10. **`journal.html`** — Editorial blog articles on mechanical watch movements and connoisseur care guides.
11. **`faq.html`** — Interactive accordion addressing movements, water resistance ratings, and care.
12. **`shipping.html`** — Charter detailing express BlueDart transit, 2-year warranty, and 14-day returns.

### Atelier Command / Admin Portal (`/admin`)
1. **`admin/index.html`** — KPI cards (Gross Revenue, Total Orders, Pending Dispatch, Low Stock Alerts) + Recent Orders table with direct fulfillment shortcuts.
2. **`admin/inventory.html`** — Product catalog management, real-time stock allocation stepper, and "Add New Timepiece" modal.
3. **`admin/orders.html`** — Complete order lifecycle manager with status transitions (`pending` → `confirmed` → `shipped` → `delivered`) and Air Waybill (AWB) courier tracking assignment.
4. **`admin/returns.html`** — Return merchandise authorization (RMA) manager allowing approvals, refunds, and automated atomic inventory restocking.
5. **`admin/clients.html`** — Complete CRM & Patron Relations manager with Lifetime Value (LTV), VIP Tier badges (Collector, Patron, Prospect), acquisition timelines, and 360° Client Dossiers.

---

## 🗄️ Database Schema (`apex.db`)

- `users` — id, name, email, password_hash, role (`customer` | `admin`), phone, created_at
- `addresses` — id, user_id, name, phone, line1, line2, city, state, pincode, is_default
- `products` — id, name, slug, sku, category, price, compare_price, stock, images (JSON), specs (JSON), description, short_desc, tags, active, featured
- `product_variants` — id, product_id, name, sku, stock, price_delta, attributes
- `cart_items` — id, user_id, product_id, variant_id, quantity
- `wishlist_items` — id, user_id, product_id
- `orders` — id, user_id, status, payment_status, subtotal, shipping, discount, total, address (JSON), items (JSON), tracking_number, notes
- `order_returns` — id, order_id, user_id, reason, description, status, items, refund_amount
- `blog_posts` — id, title, slug, excerpt, content, image, author, published_at

---

## 🛡️ API Endpoints Summary

```
POST   /api/auth/register          Register new customer
POST   /api/auth/login             Login (returns JWT)
GET    /api/auth/me                Get current user profile

GET    /api/products               List products (supports category, min, max, search, featured, sort)
GET    /api/products/:slug         Get single product with specifications & variants
POST   /api/products               [Admin] Create product
PUT    /api/products/:id           [Admin] Update product or stock
DELETE /api/products/:id           [Admin] Deactivate product

GET    /api/cart                   Get current user's bag
POST   /api/cart                   Add / increment item in bag
PUT    /api/cart/:itemId           Update quantity
DELETE /api/cart/:itemId           Remove item from bag
DELETE /api/cart                   Empty entire bag

GET    /api/wishlist               Get saved items
POST   /api/wishlist               Save item
DELETE /api/wishlist/:productId    Remove saved item

POST   /api/orders                 Place new order (validates & decrements stock)
GET    /api/orders                 List orders for authenticated client
POST   /api/orders/:id/return      Submit 14-day return request

GET    /api/admin/stats            [Admin] KPI stats, revenue, top products
GET    /api/admin/orders           [Admin] Filter & list all orders
PUT    /api/admin/orders/:id       [Admin] Update fulfillment status & tracking
GET    /api/admin/returns          [Admin] List RMA return requests
PUT    /api/admin/returns/:id      [Admin] Approve/reject & trigger restock
GET    /api/admin/inventory        [Admin] Stock & listing status overview
GET    /api/blog                   List editorial journal posts
```
