const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { createSubscription, handleWebhook } = require('../controllers/stripeController');

router.post('/create-subscription', protect, async (req, res, next) => {
    try {
        const result = await createSubscription(req.user.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const result = await handleWebhook(req.body, sig);
    res.json(result);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router;