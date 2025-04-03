const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { processChat } = require('../controllers/chatController');

// router.post('/', protect, async (req, res, next) => {
//     console.log(req + "  " + res + "    " + next);
//     try {
//         const result = await processChat(req.user.id, req.body.message);
//         res.json({
//             success: true,
//             ...result
//         });
//     } catch (err) {
//         next(err);
//     }
// });

router.post('/', protect, processChat); 

module.exports = router;