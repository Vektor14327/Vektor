const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  task: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Challenge', ChallengeSchema);