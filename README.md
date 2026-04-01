# 🏦 BuggyBank CTF — Vulnerable Banking Application

> ⚠️ **FOR EDUCATIONAL USE ONLY** — This application is **intentionally vulnerable**. It is designed for a college cybersecurity CTF competition. Do NOT deploy to the internet.

---

## 📦 Project Structure

```
BUGGYSITE/
├── server.js                  # Express backend (8 vulnerabilities)
├── package.json
├── .env                       # Hardcoded secrets (Bug #7)
├── models/
│   ├── User.js
│   ├── Transaction.js
│   └── Flag.js
└── public/
    ├── index.html             # Home page (Bugs #1, #3, #6, #7, #20)
    ├── login.html             # Login/Register (Bugs #4, #5, #13, #14)
    ├── dashboard.html         # Dashboard (Bugs #3, #14, #18, #20)
    ├── transfer.html          # Transfer (Bugs #5, #13, #14)
    ├── profile.html           # Profile (Bugs #3, #12)
    ├── admin.html             # Admin panel (Backend Bugs #7, #8)
    ├── submit.html            # Flag submission
    ├── leaderboard.html       # Leaderboard
    ├── css/
    │   └── style.css          # Bug #16 — FLAG in CSS
    └── js/
        ├── app.js             # Bugs #2,#8,#9,#10,#11,#12,#13,#15,#17,#18
        └── app.js.map         # Bug #19 — Source map exposure
```

---

## 🚀 How to Run

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) running on `localhost:27017`

### Steps

```bash
# 1. Navigate to project folder
cd D:\BUGGYSITE

# 2. Install dependencies
npm install

# 3. Make sure MongoDB is running
# Windows: Start MongoDB service or run: mongod

# 4. Start the server
npm start
# OR for auto-reload:
npm run dev

# 5. Open browser
start http://localhost:3000
```

### Seed Accounts (auto-created on first start)
| Username | Password | Role  | Balance |
|----------|----------|-------|---------|
| admin    | admin123 | admin | $99,999 |
| alice    | password123 | user | $5,000 |
| bob      | test123  | user  | $2,500  |

> 💡 Magic bypass password: **`letmein`** — works for ANY account!

---

## 🐞 All 20 Frontend Bugs

| # | Bug Type | Location | Flag |
|---|----------|----------|------|
| 1 | HTML comment flag | `index.html` source | `FLAG{html_comment_secret}` |
| 2 | `console.log` flag | Browser Console → F12 | `FLAG{console_log_exposed}` |
| 3 | CSS `display:none` element | Inspect element | `FLAG{css_hidden_element}` |
| 4 | Disabled input value | `login.html` | `FLAG{disabled_input_flag}` |
| 5 | Placeholder text leak | `login.html`, `transfer.html` | `FLAG{placeholder_leak}` |
| 6 | Image `alt` attribute | `index.html` | `FLAG{alt_text_secret}` |
| 7 | `<title>` tag flag | `index.html` title | `FLAG{title_tag_hidden}` |
| 8 | `localStorage` flag | Console: `localStorage.getItem('ctf_flag')` | `FLAG{localstorage_secret}` |
| 9 | `sessionStorage` flag | Console: `sessionStorage.getItem('session_flag')` | `FLAG{session_storage_flag}` |
| 10 | Global JS variable | Console: `DEBUG_FLAG` or `ADMIN_CREDENTIALS` | `FLAG{global_variable_leak}` |
| 11 | Base64 encoded flag | Console: `atob("RkxBR3tiYXNlNjRfZGVjb2RlZF9mbGFnfQ==")` | `FLAG{base64_decoded_flag}` |
| 12 | Hardcoded credentials | `app.js` → `ADMIN_CREDENTIALS` | `FLAG{hardcoded_admin_creds}` |
| 13 | Frontend role bypass | `profile.html` → Set role to admin | `FLAG{frontend_role_bypass}` |
| 14 | Form validation bypass | Remove `min="1"` from transfer input | `FLAG{validation_bypass}` |
| 15 | Editable DOM value | Right-click balance → Inspect → Edit HTML | `FLAG{editable_dom_balance}` |
| 16 | Network hidden API | Network tab → `/api/secret-config` | `FLAG{network_hidden_api}` |
| 17 | CSS file flag | View `style.css` source | `FLAG{css_file_secret}` |
| 18 | Obfuscated JS flag | Console: `String.fromCharCode(...obfuscatedFlag)` | `FLAG{obfuscated_js_flag}` |
| 19 | DOM XSS | `?search=<img src=x onerror=alert(1)>` | `FLAG{dom_xss_vulnerable}` |
| 20 | Source map exposure | Network tab → `app.js.map` | `FLAG{source_map_exposed}` |
| +  | Hidden button/link | Inspect navbar / bottom of index.html | `FLAG{hidden_button_revealed}` |

---

## 🔴 All 8 Backend Bugs

| # | Bug Type | How to Exploit | Flag |
|---|----------|---------------|------|
| 1 | Login bypass | POST `/api/login` with password `letmein` | `FLAG{login_bypass_success}` |
| 2 | No auth on `/api/users` | GET `/api/users` without any token | (Shows all user IDs for IDOR) |
| 3 | IDOR | GET `/api/user/{any_id}` — no ownership check | `FLAG{idor_account_access}` |
| 4 | Negative transfer | POST `/api/transfer` with `amount: -500` | `FLAG{negative_transfer_exploit}` |
| 5 | Race condition | Two simultaneous transfer requests | (Advanced — multi-thread tool) |
| 6 | Sensitive data exposure | Login response and `/api/user/:id` return password hash | `FLAG{sensitive_data_exposed}` |
| 7 | Hardcoded secrets | `.env` and `server.js` contain JWT secret | `FLAG{hardcoded_admin_creds}` |
| 8 | Weak admin auth | GET `/api/admin/dashboard` with header `x-admin-key: secretadminkey` | `FLAG{admin_panel_access}` |

---

## 🛠 Useful Commands for Participants

```bash
# List all users (no auth needed!)
curl http://localhost:3000/api/users

# Login bypass
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"letmein"}'

# Access admin panel
curl http://localhost:3000/api/admin/dashboard \
  -H "x-admin-key: secretadminkey"

# Negative transfer (get your token first from login)
curl -X POST http://localhost:3000/api/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"toUsername":"alice","amount":-500}'
```

---

## 🚩 Flag Submission

Visit `http://localhost:3000/submit.html` and enter the flag text.

**Points:** Easy = 10 | Medium = 20 | Hard = 50

---

## 📚 Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js + Express.js
- **Database:** MongoDB + Mongoose (MERN-style)
- **Auth:** JWT (jsonwebtoken) + bcryptjs

---

*Created for educational cybersecurity training. All vulnerabilities are intentional.*
