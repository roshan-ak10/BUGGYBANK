const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
