/* =====================================================
   APEX AUTH MODULE
   Handles login, register, logout, and auth state
   ===================================================== */

const Auth = (() => {
  const TOKEN_KEY = 'apex_token';
  const USER_KEY  = 'apex_user';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function getUser()  { 
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } 
    catch { return null; } 
  }
  function isLoggedIn() { return !!getToken(); }
  function isAdmin()    { return getUser()?.role === 'admin'; }

  function store(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function login(email, password) {
    const data = await API.auth.login(email, password);
    store(data.token, data.user);
    return data;
  }

  async function register(name, email, password, phone) {
    const data = await API.auth.register(name, email, password, phone);
    store(data.token, data.user);
    return data;
  }

  function logout() {
    clear();
    const prefix = window.location.pathname.includes('/admin/') ? '../' : '';
    window.location.href = prefix + 'index.html';
  }

  // Update nav UI based on auth state
  function updateNav() {
    const user = getUser();
    const accountLinks = document.querySelectorAll('[data-auth-account]');
    const loginLinks   = document.querySelectorAll('[data-auth-login]');
    const adminLinks   = document.querySelectorAll('[data-auth-admin]');
    const userNameEls  = document.querySelectorAll('[data-auth-name]');

    accountLinks.forEach(el => el.style.display = user ? '' : 'none');
    loginLinks.forEach(el => el.style.display = user ? 'none' : '');
    adminLinks.forEach(el => el.style.display = (user?.role === 'admin') ? '' : 'none');
    userNameEls.forEach(el => el.textContent = user?.name || '');
  }

  // Require auth — redirect to login if not authenticated
  function requireAuth(redirectUrl) {
    if (!isLoggedIn()) {
      const prefix = window.location.pathname.includes('/admin/') ? '../' : '';
      window.location.href = `${prefix}account.html?redirect=${encodeURIComponent(redirectUrl || window.location.pathname)}`;
      return false;
    }
    return true;
  }

  // Require admin — redirect home if not admin
  function requireAdmin() {
    if (!isAdmin()) {
      const prefix = window.location.pathname.includes('/admin/') ? '../' : '';
      window.location.href = prefix + 'index.html';
      return false;
    }
    return true;
  }

  return { getToken, getUser, isLoggedIn, isAdmin, login, register, logout, updateNav, requireAuth, requireAdmin };
})();

window.Auth = Auth;

// Auto-update nav on every page load
document.addEventListener('DOMContentLoaded', () => Auth.updateNav());
