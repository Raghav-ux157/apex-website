/* ==========================================================================
   APEX ATELIER ADMIN MANAGEMENT LOGIC (admin.js)
   Controls authentication guard, KPI cards, order dispatch, and inventory
   ========================================================================== */

const ApexAdmin = (() => {
  function checkAuth() {
    if (!window.Auth || !Auth.isLoggedIn()) {
      window.location.href = '../account.html?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    if (!Auth.isAdmin()) {
      alert('Access Restricted: This terminal is strictly reserved for APEX Atelier Administrators.');
      window.location.href = '../index.html';
      return false;
    }
    return true;
  }

  // Format currency
  function fmt(val) {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  }

  // Toast
  function toast(msg, type = 'success') {
    if (window.ApexStore) ApexStore.toast(msg, type);
    else alert(msg);
  }

  return {
    checkAuth,
    fmt,
    toast
  };
})();

window.ApexAdmin = ApexAdmin;
