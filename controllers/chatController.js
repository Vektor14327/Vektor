const User = require('../models/User');
const Challenge = require('../models/Challenge');
const { getVektorResponse } = require('../utils/xaiClient');
const ErrorResponse = require('../utils/ErrorResponse');

exports.processChat = async (req, res, next) => {
    try {
        if (!req.user?.id) {
          console.error('[ERROR] req.user.id missing');
          return next(new ErrorResponse('Authentication failed', 401));
        }

        const user = await User.findById(req.user.id);

        const { message } = req.body;
        if (!message) {
            return next(new ErrorResponse("Message is required", 400));
        }

        if (user.chatCount >= 3 && !user.isPaid) {
            return next(new ErrorResponse('Free chat limit reached. Please upgrade to continue.', 402));
        }

        const aiResponse = await getVektorResponse(message);
        const isWin = checkForWin(message);

        if (isWin) {
            user.wins += 1;
            if (user.challengeDay < 7) {
                const today = new Date().toDateString();
                const lastUpdate = user.lastChallengeUpdate?.toDateString();
                if (!lastUpdate || lastUpdate !== today) {
                    user.challengeDay += 1;
                    user.lastChallengeUpdate = new Date();
                }
            }
        }

        user.chatCount += 1;
        await user.save();

        const challenge = await Challenge.findOne({ day: user.challengeDay });

        res.json({
            success: true,
            data: {
                response: aiResponse,
                wins: user.wins,
                challenge,
                chatCount: user.chatCount,
                isPaid: user.isPaid
            }
        });

    } catch (err) {
        console.error('[ERROR] processChat crash:', err);
        next(err);
    }
};

function checkForWin(message) {
    const winKeywords = ['done', 'complete', 'finished', 'achieved', 'log'];
    return winKeywords.some(keyword =>
        message.toLowerCase().includes(keyword)
    );
}