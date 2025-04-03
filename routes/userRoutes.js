const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { getCurrentUser } = require('../controllers/userController');

router.get('/me', protect, async (req, res, next) => {
  try {
    const result = await getCurrentUser(req.user.id);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;