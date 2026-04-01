// =====================================================================
// BuggyBank CTF - Main Application JavaScript
// FRONTEND BUG #2:  console.log flag - FLAG{console_log_exposed}
// FRONTEND BUG #9:  Global variable exposure - FLAG{global_variable_leak}
// FRONTEND BUG #10: Base64 encoded flag
// FRONTEND BUG #11: Hardcoded credentials in JS - FLAG{hardcoded_admin_creds}
// FRONTEND BUG #12: Fake frontend role bypass - FLAG{frontend_role_bypass}
// FRONTEND BUG #17: Obfuscated JavaScript with encoded flag
// =====================================================================

// FRONTEND BUG #9 — Global variable leak (accessible from browser console)
var SECRET_API_KEY = 'sk-buggy-9fk3j2p99xz'; // FLAG{global_variable_leak}
var DEBUG_FLAG = 'FLAG{global_variable_leak}';
var APP_VERSION = '1.3.7-debug';

// FRONTEND BUG #11 — Hardcoded credentials
// Open browser console and type: ADMIN_CREDENTIALS
var ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',   // FLAG{hardcoded_admin_creds}
  role: 'superadmin'
};

// FRONTEND BUG #2 — console.log with flag (check browser console!)
console.log('%c[DEBUG] BuggyBank initialized', 'color: green; font-weight: bold; font-size:14px');
console.log('[DEBUG] Flag for console hunters: FLAG{console_log_exposed}');
console.log('[DEBUG] Admin credentials:', ADMIN_CREDENTIALS);
console.log('[DEBUG] API Key:', SECRET_API_KEY);
console.warn('[WARN] Running in debug mode - not for production!');

// FRONTEND BUG #10 — Base64 encoded flag (decode to get flag)
// Hint: Check the JS source. Decode this base64 string!
var ENCODED_FLAG = 'RkxBR3tiYXNlNjRfZGVjb2RlZF9mbGFnfQ=='; // base64 of FLAG{base64_decoded_flag}
console.log('[DEBUG] Encoded secret:', ENCODED_FLAG, '-- Try: atob("' + ENCODED_FLAG + '")');

// FRONTEND BUG #17 — Obfuscated JS (hex-encoded flag)
// eval this in console: String.fromCharCode(...obfuscatedFlag)
var obfuscatedFlag = [70,76,65,71,123,111,98,102,117,115,99,97,116,101,100,95,106,115,95,102,108,97,103,125];
// Decoded: FLAG{obfuscated_js_flag}
var _0x3f2a = function(arr) { return arr.map(c => String.fromCharCode(c)).join(''); };
console.log('[HIDDEN]', _0x3f2a(obfuscatedFlag));

// =====================================================================
// LOCALSTORAGE / SESSION STORAGE
// FRONTEND BUG #8: Flags stored in browser storage
// =====================================================================
localStorage.setItem('ctf_flag', 'FLAG{localstorage_secret}');
localStorage.setItem('debug_user', JSON.stringify({ role: 'admin', hidden: true }));
sessionStorage.setItem('session_flag', 'FLAG{session_storage_flag}');
sessionStorage.setItem('temp_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.debug');

// =====================================================================
// AUTH UTILITIES
// =====================================================================
function getToken() {
  return localStorage.getItem('token');
}

function getCurrentUser() {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}

function saveAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// =====================================================================
// FRONTEND BUG #12 — Fake frontend role check
// Change user.role in localStorage to "admin" to access admin features!
// Open console: let u = JSON.parse(localStorage.getItem('user')); u.role='admin'; localStorage.setItem('user', JSON.stringify(u));
// =====================================================================
function checkAdminRole() {
  const user = getCurrentUser();
  if (user && user.role === 'admin') {
    // FLAG{frontend_role_bypass} - role changed in localStorage, not server-side!
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = 'block';
      el.querySelector && el.querySelector('.flag-reveal') && (el.querySelector('.flag-reveal').textContent = 'FLAG{frontend_role_bypass}');
    });
    console.log('Admin mode unlocked! FLAG{frontend_role_bypass}');
    return true;
  }
  return false;
}

// Populate navbar username
function updateNavbar() {
  const user = getCurrentUser();
  const nameEl = document.getElementById('nav-username');
  if (nameEl && user) nameEl.textContent = user.username;
  const token = getToken();
  document.querySelectorAll('.auth-required').forEach(el => {
    el.style.display = token ? '' : 'none';
  });
  document.querySelectorAll('.auth-hidden').forEach(el => {
    el.style.display = token ? 'none' : '';
  });
  checkAdminRole();
}

// =====================================================================
// API HELPERS
// =====================================================================
async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(url, { ...options, headers });
  return res.json();
}

// =====================================================================
// FRONTEND BUG #15 — Hidden API call visible in Network tab
// This silently calls /api/secret-config on every page load
// FLAG{network_hidden_api}
// =====================================================================
(async function hiddenApiCall() {
  try {
    const data = await apiFetch('/api/secret-config');
    // Store secretly - check Network tab to find this!
    window._secretConfig = data;
  } catch (e) { /* silent */ }
})();

// =====================================================================
// FRONTEND BUG #18 — DOM-based XSS
// The search parameter from URL is injected directly into DOM without sanitization
// Test: /dashboard.html?search=<img src=x onerror="alert('FLAG{dom_xss_vulnerable}')">
// =====================================================================
function checkXSSParam() {
  const params = new URLSearchParams(window.location.search);
  const search = params.get('search');
  const xssEl = document.getElementById('search-output');
  if (search && xssEl) {
    // VULNERABILITY: innerHTML used directly with user input!
    xssEl.innerHTML = 'Search results for: ' + search; // FLAG{dom_xss_vulnerable}
  }
}

// =====================================================================
// FRONTEND BUG #13 — Form validation bypass
// Amount validation is ONLY done on frontend. Backend does not check.
// Users can remove the "min" attribute from the input to send negative amounts.
// =====================================================================
function validateTransferForm() {
  const amount = parseFloat(document.getElementById('transfer-amount')?.value);
  if (isNaN(amount) || amount <= 0) {
    showAlert('transfer-alert', 'Amount must be greater than 0!', 'danger');
    return false; // Only frontend check — remove this via DevTools!
  }
  return true;
}

// =====================================================================
// ALERT HELPER
// =====================================================================
function showAlert(containerId, message, type = 'info') {
  const el = document.getElementById(containerId);
  if (el) {
    el.className = 'alert alert-' + type;
    el.textContent = message;
    el.style.display = 'block';
  }
}

// Run on every page
document.addEventListener('DOMContentLoaded', function () {
  updateNavbar();
  checkXSSParam();
});
