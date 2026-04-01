require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const User = require('./models/User');
const Transaction = require('./models/Transaction');
const { Flag, Submission } = require('./models/Flag');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ===================================================================
// BACKEND BUG #7: Hardcoded JWT Secret (also in .env)
// ===================================================================
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'; // FLAG{hardcoded_jwt_secret}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    seedFlags();
    seedAdminUser();
  })
  .catch(err => console.error('MongoDB error:', err));

// ===================================================================
// SEED: Pre-populate flags in DB
// ===================================================================
async function seedFlags() {
  const flags = [
    { flagValue: 'FLAG{html_comment_secret}', description: 'Found in HTML source comment', points: 10, difficulty: 'easy' },
    { flagValue: 'FLAG{console_log_exposed}', description: 'Found via browser console', points: 10, difficulty: 'easy' },
    { flagValue: 'FLAG{css_hidden_element}', description: 'Found via display:none element', points: 10, difficulty: 'easy' },
    { flagValue: 'FLAG{disabled_input_flag}', description: 'Found in disabled input field', points: 10, difficulty: 'easy' },
    { flagValue: 'FLAG{placeholder_leak}', description: 'Found in placeholder text', points: 10, difficulty: 'easy' },
    { flagValue: 'FLAG{alt_text_secret}', description: 'Found in image alt attribute', points: 10, difficulty: 'easy' },
    { flagValue: 'FLAG{title_tag_hidden}', description: 'Found in page title tag', points: 10, difficulty: 'easy' },
    { flagValue: 'FLAG{localstorage_secret}', description: 'Found in localStorage', points: 10, difficulty: 'easy' },
    { flagValue: 'FLAG{session_storage_flag}', description: 'Found in sessionStorage', points: 10, difficulty: 'easy' },
    { flagValue: 'FLAG{global_variable_leak}', description: 'Found as global JS variable', points: 10, difficulty: 'easy' },
    { flagValue: 'FLAG{base64_decoded_flag}', description: 'Found by decoding base64 string', points: 20, difficulty: 'medium' },
    { flagValue: 'FLAG{hardcoded_admin_creds}', description: 'Found hardcoded credentials in JS', points: 20, difficulty: 'medium' },
    { flagValue: 'FLAG{frontend_role_bypass}', description: 'Changed role in JS to admin', points: 20, difficulty: 'medium' },
    { flagValue: 'FLAG{validation_bypass}', description: 'Bypassed frontend-only form validation', points: 20, difficulty: 'medium' },
    { flagValue: 'FLAG{editable_dom_balance}', description: 'Edited balance via DevTools', points: 20, difficulty: 'medium' },
    { flagValue: 'FLAG{network_hidden_api}', description: 'Found hidden API call in Network tab', points: 20, difficulty: 'medium' },
    { flagValue: 'FLAG{css_file_secret}', description: 'Found flag hidden in CSS file', points: 20, difficulty: 'medium' },
    { flagValue: 'FLAG{obfuscated_js_flag}', description: 'Decoded obfuscated JavaScript', points: 20, difficulty: 'medium' },
    { flagValue: 'FLAG{dom_xss_vulnerable}', description: 'Exploited DOM-based XSS', points: 20, difficulty: 'medium' },
    { flagValue: 'FLAG{source_map_exposed}', description: 'Found via .map file', points: 20, difficulty: 'medium' },
    { flagValue: 'FLAG{hidden_button_revealed}', description: 'Found hidden button via inspect', points: 10, difficulty: 'easy' },
    { flagValue: 'FLAG{idor_account_access}', description: 'Accessed another account via IDOR', points: 50, difficulty: 'hard' },
    { flagValue: 'FLAG{negative_transfer_exploit}', description: 'Transferred negative money to gain balance', points: 50, difficulty: 'hard' },
    { flagValue: 'FLAG{login_bypass_success}', description: 'Bypassed login with SQL-like injection', points: 50, difficulty: 'hard' },
    { flagValue: 'FLAG{admin_panel_access}', description: 'Accessed admin panel without authorization', points: 50, difficulty: 'hard' },
    { flagValue: 'FLAG{sensitive_data_exposed}', description: 'Retrieved passwords from API response', points: 50, difficulty: 'hard' },
  ];

  for (const f of flags) {
    await Flag.findOneAndUpdate({ flagValue: f.flagValue }, f, { upsert: true });
  }
  console.log('Flags seeded!');
}

async function seedAdminUser() {
  const exists = await User.findOne({ username: 'admin' });
  if (!exists) {
    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', password: hashed, email: 'admin@buggybank.com', balance: 99999, role: 'admin' });
    const hashed2 = await bcrypt.hash('password123', 10);
    await User.create({ username: 'alice', password: hashed2, email: 'alice@buggybank.com', balance: 5000, role: 'user' });
    const hashed3 = await bcrypt.hash('test123', 10);
    await User.create({ username: 'bob', password: hashed3, email: 'bob@buggybank.com', balance: 2500, role: 'user' });
    console.log('Seed users created: admin/admin123, alice/password123, bob/test123');
  }
}

// ===================================================================
// MIDDLEWARE: Auth verification
// ===================================================================
function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ===================================================================
// BACKEND BUG #1: Login Bypass via weak auth
// The server checks password with bcrypt BUT also allows a magic bypass
// password "letmein" for any account (FLAG{login_bypass_success})
// ===================================================================
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'User not found' });

    // BACKEND BUG #1: Magic bypass password works for ANY account
    const magicBypass = password === 'letmein';
    const validPassword = magicBypass ? true : await bcrypt.compare(password, user.password);

    if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    // BACKEND BUG #5: Returning sensitive data (password hash) in response
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        role: user.role,
        // BACKEND BUG #5: Sensitive data exposure - returning hashed password
        password_hash: user.password // FLAG{sensitive_data_exposed}
      },
      message: magicBypass ? 'FLAG{login_bypass_success} - Magic bypass used!' : 'Login successful'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// Register endpoint
// ===================================================================
app.post('/api/register', async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed, email, balance: 1000 });
    res.json({ message: 'Registration successful! Starting balance: $1000', userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// BACKEND BUG #2: No authentication on /api/users - lists all users
// with their balances and IDs (enables IDOR discovery)
// ===================================================================
app.get('/api/users', async (req, res) => {
  // BACKEND BUG #2: No auth middleware! Anyone can list all users
  try {
    const users = await User.find({}, 'username email balance role _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// BACKEND BUG #3: IDOR - Accessing ANOTHER user's account by ID
// No ownership check! Anyone with a token can view any user's data.
// FLAG{idor_account_access}
// ===================================================================
app.get('/api/user/:id', authMiddleware, async (req, res) => {
  try {
    // BACKEND BUG #3: No check that req.user.id === req.params.id
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // BACKEND BUG #5: Also exposing password hash here
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      role: user.role,
      password_hash: user.password, // FLAG{sensitive_data_exposed}
      flag: user.role === 'admin' ? 'FLAG{idor_account_access}' : undefined
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile (authenticated)
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ id: user._id, username: user.username, email: user.email, balance: user.balance, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// BACKEND BUG #4: Negative money transfer - no validation of amount
// Send negative amount to steal money. FLAG{negative_transfer_exploit}
// BACKEND BUG #5 (Race Condition): No locking on balance updates
// ===================================================================
app.post('/api/transfer', authMiddleware, async (req, res) => {
  const { toUsername, amount, note } = req.body;
  try {
    const sender = await User.findById(req.user.id);

    // BACKEND BUG #4: No check that amount > 0. Negative amounts allowed!
    // if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' }); // THIS LINE INTENTIONALLY REMOVED

    if (!sender) return res.status(404).json({ error: 'Sender not found' });

    const receiver = await User.findOne({ username: toUsername });
    if (!receiver) return res.status(404).json({ error: 'Recipient not found' });

    // BACKEND BUG #5 (Race Condition): Read-then-write without atomic operation
    // Two simultaneous transfers can both pass the balance check
    if (amount > 0 && sender.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Non-atomic update vulnerable to race condition
    sender.balance -= amount;
    receiver.balance += amount;
    await sender.save();
    await receiver.save();

    await Transaction.create({ from: sender.username, to: receiver.username, amount, note });

    const flag = amount < 0 ? ' FLAG{negative_transfer_exploit}' : '';
    res.json({
      message: `Transfer complete!${flag}`,
      newBalance: sender.balance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get transactions for logged-in user
app.get('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const txns = await Transaction.find({
      $or: [{ from: req.user.username }, { to: req.user.username }]
    }).sort({ timestamp: -1 }).limit(20);
    res.json(txns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// BACKEND BUG #6 & #8: Admin panel with NO proper protection
// Only checks a simple header, no real auth. FLAG{admin_panel_access}
// ===================================================================
app.get('/api/admin/dashboard', async (req, res) => {
  // BACKEND BUG #8: "Protection" is just checking a header value - not real auth
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== 'secretadminkey') {
    return res.status(403).json({ error: 'Forbidden. Hint: Try x-admin-key header.' });
  }

  try {
    const users = await User.find({});
    const transactions = await Transaction.find({}).sort({ timestamp: -1 }).limit(50);
    res.json({
      flag: 'FLAG{admin_panel_access}',
      message: 'Welcome to the admin dashboard!',
      totalUsers: users.length,
      users: users.map(u => ({ username: u.username, balance: u.balance, role: u.role, password: u.password })),
      recentTransactions: transactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// BACKEND BUG #2: No auth on this hidden endpoint - Network tab visible
// FLAG{network_hidden_api}
// ===================================================================
app.get('/api/secret-config', (req, res) => {
  res.json({
    flag: 'FLAG{network_hidden_api}',
    secret: 'This endpoint is called from dashboard.js',
    adminEmail: 'admin@buggybank.com',
    backupKey: 'bkp_key_9f3k2p',
    debugMode: true
  });
});

// ===================================================================
// FLAG SUBMISSION SYSTEM
// ===================================================================
app.post('/api/submit', authMiddleware, async (req, res) => {
  const { flagValue } = req.body;
  try {
    const flag = await Flag.findOne({ flagValue });
    if (!flag) return res.status(400).json({ error: 'Invalid flag! Keep trying.' });

    const alreadySubmitted = await Submission.findOne({ username: req.user.username, flagValue });
    if (alreadySubmitted) return res.status(400).json({ error: 'Flag already submitted!' });

    await Submission.create({ username: req.user.username, flagValue, points: flag.points });
    res.json({ message: `Correct! +${flag.points} points`, points: flag.points, description: flag.description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// LEADERBOARD SYSTEM - No auth required
// ===================================================================
app.get('/api/leaderboard', async (req, res) => {
  try {
    const submissions = await Submission.find({});
    const scores = {};
    submissions.forEach(s => {
      if (!scores[s.username]) scores[s.username] = 0;
      scores[s.username] += s.points;
    });
    const leaderboard = Object.entries(scores)
      .map(([username, points]) => ({ username, points }))
      .sort((a, b) => b.points - a.points);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all: serve index.html for frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BuggyBank CTF running on http://localhost:${PORT}`));
