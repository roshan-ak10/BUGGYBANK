const mongoose = require('mongoose');

// BACKEND BUG #5: Sensitive data exposure - password stored with weak hashing, returned in API responses
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // BACKEND BUG: passwords returned in some API calls
  email: { type: String, required: true },
  balance: { type: Number, default: 1000 },
  role: { type: String, default: 'user' }, // 'user' or 'admin'
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
});

module.exports = mongoose.model('User', UserSchema);
