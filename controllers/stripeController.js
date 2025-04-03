const User = require('../models/User');
const { createCheckoutSession, constructWebhookEvent, createCustomer } = require('../config/stripe');
const ErrorResponse = require('../utils/ErrorResponse');

const createSubscription = async (userId) => {  
    const user = await User.findById(userId);

    if (!user) {
        throw new ErrorResponse('User not found', 404);
    }

    // Create customer if doesn't exist
    if (!user.stripeCustomerId) {
        try {
            if (!user?.email) throw new Error('User email required');
            if (!user?._id) throw new Error('User ID required');

            const customer = await createCustomer(user.email, user._id.toString());
            user.stripeCustomerId = customer.id;
            await user.save();
        } catch (err) {
            console.error('Stripe customer creation failed:', err);
            throw new ErrorResponse(`Customer creation failed: ${err.message}`, 500);
        }
    }

    // Create checkout session with hardcoded pricing
    const session = await createCheckoutSession(
        user.stripeCustomerId,
        process.env.SUBSCRIPTION_AMOUNT,
        process.env.SUBSCRIPTION_DESCRIPTION,
        `${process.env.FRONTEND_URL}`,
        `${process.env.FRONTEND_URL}`
    );

    user.isPaid = true;
    await user.save();

    return session;
};

const handleWebhook = async (payload, sig) => {
    const event = constructWebhookEvent(payload, sig);

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await User.findOneAndUpdate(
                { stripeCustomerId: session.customer },
                {
                    isPaid: true,
                    subscriptionId: session.subscription,
                    lastPaymentDate: new Date(),
                    subscriptionExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                }
            );
            break;

        case 'customer.subscription.deleted':
            const subscription = event.data.object;
            await User.findOneAndUpdate(
                { subscriptionId: subscription.id },
                { isPaid: false, subscriptionId: null }
            );
            break;

        default:
            return { handled: false };
    }

    return { handled: true };
};

module.exports = {
    createSubscription,
    handleWebhook,
};