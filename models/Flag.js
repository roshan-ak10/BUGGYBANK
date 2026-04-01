const mongoose = require('mongoose');

const FlagSchema = new mongoose.Schema({
  flagValue: { type: String, required: true, unique: true },
  description: { type: String },
  points: { type: Number, default: 10 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' }
});

const SubmissionSchema = new mongoose.Schema({
  username: { type: String, required: true },
  flagValue: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  points: { type: Number, default: 0 }
});

module.exports = {
  Flag: mongoose.model('Flag', FlagSchema),
  Submission: mongoose.model('Submission', SubmissionSchema)
};
