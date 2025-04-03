const User = require('../models/User');
const Challenge = require('../models/Challenge');
const ErrorResponse = require('../utils/ErrorResponse');

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  const challenge = await Challenge.findOne({ day: user.challengeDay });
  
  return {
    user,
    challenge
  };
};

module.exports = {
  getCurrentUser
};