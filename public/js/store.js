/* ==========================================================================
   APEX STORE CLIENT (store.js)
   Shared storefront logic: Cart Drawer, Wishlist, Badges, Toast & Renderers
   ========================================================================== */

const ApexStore = (() => {
  // Format INR price: e.g. 9800 -> ₹9,800
  function formatINR(amount) {
    if (amount === undefined || amount === null) return '₹0';
    return '₹' + Number(amount).toLocaleString('en-IN');
  }

  // Toast notifications
  function toast(message, type = 'gold') {
    let container = document.getElementById('apex-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'apex-toast-container';
      document.body.appendChild(container);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `apex-toast ${type === 'error' ? 'toast-error' : (type === 'success' ? 'toast-success' : '')}`;
    
    let icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    if (type === 'success') {
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`;
    } else if (type === 'gold') {
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 2,22 22,22"/></svg>`;
    }

    toastEl.innerHTML = `<span>${icon}</span><span style="flex-grow:1">${message}</span>`;
    container.appendChild(toastEl);

    setTimeout(() => {
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateX(40px)';
      toastEl.style.transition = 'all 0.3s ease';
      setTimeout(() => toastEl.remove(), 300);
    }, 3200);
  }

  // Local fallback storage if user is a guest (not yet logged in)
  const GUEST_CART_KEY = 'apex_guest_cart';
  const GUEST_WISH_KEY = 'apex_guest_wish';

  function getGuestCart() {
    try { return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]'); }
    catch { return []; }
  }
  function setGuestCart(cart) {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  }

  function getGuestWish() {
    try { return JSON.parse(localStorage.getItem(GUEST_WISH_KEY) || '[]'); }
    catch { return []; }
  }
  function setGuestWish(wish) {
    localStorage.setItem(GUEST_WISH_KEY, JSON.stringify(wish));
  }

  // Fetch or calculate cart
  async function getCart() {
    if (window.Auth && Auth.isLoggedIn()) {
      try {
        return await API.cart.get();
      } catch (err) {
        console.warn('API cart fetch failed, fallback to local', err);
      }
    }
    const items = getGuestCart();
    const total = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    return { items, total };
  }

  // Add to cart
  async function addToCart(product, quantity = 1, variantId = null) {
    if (window.Auth && Auth.isLoggedIn()) {
      try {
        await API.cart.add(product.id, variantId, quantity);
        toast(`Added "${product.name}" to bag`, 'success');
        await updateBadges();
        openDrawer();
        return;
      } catch (err) {
        console.warn('API cart add error, falling back to local', err);
      }
    }

    // Guest fallback
    const cart = getGuestCart();
    const existing = cart.find(i => i.product_id === product.id && i.variant_id === variantId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: 'g_' + Date.now(),
        product_id: product.id,
        variant_id: variantId,
        quantity: quantity,
        name: product.name,
        slug: product.slug,
        price: product.price,
        effectivePrice: product.price,
        images: product.images || ['img/ph-black-gold-1.svg'],
        stock: product.stock || 10
      });
    }
    setGuestCart(cart);
    toast(`Added "${product.name}" to bag`, 'success');
    await updateBadges();
    openDrawer();
  }

  // Update item quantity
  async function updateCartQty(itemId, quantity) {
    if (window.Auth && Auth.isLoggedIn()) {
      try {
        await API.cart.update(itemId, quantity);
        await refreshDrawer();
        await updateBadges();
        return;
      } catch (err) {
        console.warn(err);
      }
    }
    let cart = getGuestCart();
    if (quantity <= 0) {
      cart = cart.filter(i => i.id !== itemId && i.product_id !== itemId);
    } else {
      const it = cart.find(i => i.id === itemId || i.product_id === itemId);
      if (it) it.quantity = quantity;
    }
    setGuestCart(cart);
    await refreshDrawer();
    await updateBadges();
  }

  // Remove from cart
  async function removeFromCart(itemId) {
    await updateCartQty(itemId, 0);
    toast('Item removed from bag');
  }

  // Wishlist toggle
  async function toggleWishlist(product) {
    const isWish = isProductWishlisted(product.id);
    if (window.Auth && Auth.isLoggedIn()) {
      try {
        if (isWish) {
          await API.wishlist.remove(product.id);
          toast(`Removed "${product.name}" from wishlist`);
        } else {
          await API.wishlist.add(product.id);
          toast(`Saved "${product.name}" to wishlist`, 'success');
        }
        await updateBadges();
        updateWishlistIcons();
        return;
      } catch (err) {
        console.warn(err);
      }
    }

    // Guest fallback
    let wish = getGuestWish();
    if (isWish) {
      wish = wish.filter(id => id !== product.id);
      toast(`Removed "${product.name}" from wishlist`);
    } else {
      wish.push(product.id);
      toast(`Saved "${product.name}" to wishlist`, 'success');
    }
    setGuestWish(wish);
    await updateBadges();
    updateWishlistIcons();
  }

  function isProductWishlisted(productId) {
    const wish = getGuestWish();
    return wish.includes(productId);
  }

  function updateWishlistIcons() {
    document.querySelectorAll('[data-wishlist-id]').forEach(btn => {
      const pid = Number(btn.dataset.wishlistId);
      if (isProductWishlisted(pid)) {
        btn.classList.add('active');
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
      } else {
        btn.classList.remove('active');
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
      }
    });
  }

  // Update header count badges
  async function updateBadges() {
    const { items } = await getCart();
    const count = items.reduce((s, i) => s + i.quantity, 0);
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });

    const wish = getGuestWish();
    document.querySelectorAll('[data-wish-count]').forEach(el => {
      el.textContent = wish.length;
      el.style.display = wish.length > 0 ? 'flex' : 'none';
    });
  }

  // Drawer HTML Injection & Control
  function ensureDrawer() {
    if (document.getElementById('apex-cart-drawer')) return;
    const div = document.createElement('div');
    div.innerHTML = `
      <div id="apex-cart-overlay" class="drawer-overlay" onclick="ApexStore.closeDrawer()"></div>
      <aside id="apex-cart-drawer" class="cart-drawer">
        <div class="drawer-header">
          <h3 class="drawer-title">Shopping Bag</h3>
          <button class="drawer-close" onclick="ApexStore.closeDrawer()">✕</button>
        </div>
        <div id="apex-drawer-body" class="drawer-body">
          <!-- Live items injected here -->
        </div>
        <div id="apex-drawer-footer" class="drawer-footer">
          <div class="drawer-subtotal">
            <span>Subtotal</span>
            <span id="apex-drawer-subtotal">₹0</span>
          </div>
          <div class="drawer-total">
            <span>Estimated Total</span>
            <span id="apex-drawer-total">₹0</span>
          </div>
          <a href="checkout.html" class="btn btn-primary btn-block">Proceed to Checkout</a>
          <a href="cart.html" style="display:block; text-align:center; margin-top:12px; font-size:12px; letter-spacing:0.1em; text-transform:uppercase; color:var(--color-gold);">View Full Bag</a>
        </div>
      </aside>
    `;
    document.body.appendChild(div);
  }

  function openDrawer() {
    ensureDrawer();
    refreshDrawer();
    document.getElementById('apex-cart-overlay').classList.add('active');
    document.getElementById('apex-cart-drawer').classList.add('active');
  }

  function closeDrawer() {
    const overlay = document.getElementById('apex-cart-overlay');
    const drawer = document.getElementById('apex-cart-drawer');
    if (overlay) overlay.classList.remove('active');
    if (drawer) drawer.classList.remove('active');
  }

  async function refreshDrawer() {
    ensureDrawer();
    const body = document.getElementById('apex-drawer-body');
    const { items, total } = await getCart();

    if (!items || items.length === 0) {
      body.innerHTML = `
        <div style="text-align:center; padding: 60px 20px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--color-text-dim); margin-bottom:16px;">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <h4 style="font-family:var(--font-serif); font-size:20px; margin:0 0 8px;">Your bag is empty</h4>
          <p style="font-size:13px; color:var(--color-text-dim); margin-bottom:24px;">Discover our collection of handcrafted precision timepieces.</p>
          <a href="shop.html" class="btn btn-secondary btn-sm" onclick="ApexStore.closeDrawer()">Explore Collection</a>
        </div>
      `;
      document.getElementById('apex-drawer-footer').style.display = 'none';
      return;
    }

    document.getElementById('apex-drawer-footer').style.display = 'block';
    document.getElementById('apex-drawer-subtotal').textContent = formatINR(total);
    document.getElementById('apex-drawer-total').textContent = formatINR(total);

    body.innerHTML = items.map(item => {
      const img = Array.isArray(item.images) ? item.images[0] : (item.images || 'img/ph-black-gold-1.svg');
      const itemPrice = item.effectivePrice || item.price;
      return `
        <div class="cart-item-row">
          <img src="${img}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <h4 class="cart-item-title">${item.name}</h4>
            <div class="cart-item-price">${formatINR(itemPrice)}</div>
            <div class="cart-qty-control">
              <button class="cart-qty-btn" onclick="ApexStore.updateCartQty('${item.id || item.product_id}', ${item.quantity - 1})">-</button>
              <span class="cart-qty-num">${item.quantity}</span>
              <button class="cart-qty-btn" onclick="ApexStore.updateCartQty('${item.id || item.product_id}', ${item.quantity + 1})">+</button>
            </div>
          </div>
          <button onclick="ApexStore.removeFromCart('${item.id || item.product_id}')" style="background:none; border:none; color:var(--color-text-dim); cursor:pointer; padding:4px;" title="Remove">✕</button>
        </div>
      `;
    }).join('');
  }

  // Render a luxury product card HTML snippet
  function renderProductCard(p) {
    const mainImg = Array.isArray(p.images) ? p.images[0] : (p.images || 'img/ph-black-gold-1.svg');
    const badgeHtml = p.featured ? `<span class="product-badge">Flagship</span>` : (p.compare_price ? `<span class="product-badge">Special Edition</span>` : '');
    const isWish = isProductWishlisted(p.id);

    return `
      <article class="product-card" data-category="${p.category}" data-price="${p.price}">
        <div class="product-thumb-wrap">
          ${badgeHtml}
          <button class="product-wish-btn ${isWish ? 'active' : ''}" data-wishlist-id="${p.id}" onclick='ApexStore.toggleWishlist(${JSON.stringify(p).replace(/'/g, "&apos;")})' aria-label="Wishlist">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isWish ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
          <a href="product.html?slug=${p.slug}" style="display:contents;">
            <img src="${mainImg}" alt="${p.name}" class="product-thumb" loading="lazy">
          </a>
        </div>
        <div class="product-info">
          <span class="product-category">${p.category}</span>
          <h3 class="product-name"><a href="product.html?slug=${p.slug}">${p.name}</a></h3>
          <p class="product-desc-snippet">${p.short_desc || p.description || ''}</p>
          <div class="product-bottom">
            <div class="product-price-wrap">
              <span class="product-price">${formatINR(p.price)}</span>
              ${p.compare_price ? `<span class="product-compare-price">${formatINR(p.compare_price)}</span>` : ''}
            </div>
            <button class="product-add-btn" onclick='ApexStore.addToCart(${JSON.stringify(p).replace(/'/g, "&apos;")})'>+ Add to Bag</button>
          </div>
        </div>
      </article>
    `;
  }

  // Setup header mobile menu & common events
  function init() {
    ensureDrawer();
    updateBadges();
    updateWishlistIcons();

    // Mobile nav toggle
    const toggle = document.querySelector('.nav-mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-nav-drawer');
    if (toggle && mobileMenu) {
      toggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
      });
    }
  }

  return {
    formatINR,
    toast,
    getCart,
    addToCart,
    updateCartQty,
    removeFromCart,
    toggleWishlist,
    isProductWishlisted,
    updateBadges,
    updateWishlistIcons,
    openDrawer,
    closeDrawer,
    refreshDrawer,
    renderProductCard,
    init
  };
})();

window.ApexStore = ApexStore;

document.addEventListener('DOMContentLoaded', () => {
  ApexStore.init();
});
