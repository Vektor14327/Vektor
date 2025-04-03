const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (customerId, amount, description, successUrl, cancelUrl) => {
    try {
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: description,
                        },
                        unit_amount: amount, // amount in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment', // or 'subscription' if you want recurring payments
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        return { url: session.url };
    } catch (err) {
        console.error('Checkout session error:', err);
        throw new Error(`Checkout failed: ${err.message}`);
    }
};


// Webhook verification (for both test and production)
const constructWebhookEvent = (payload, sig) => {
    const webhookSecret = process.env.NODE_ENV === 'production' 
        ? process.env.STRIPE_LIVE_WEBHOOK_SECRET 
        : process.env.STRIPE_TEST_WEBHOOK_SECRET;
    
    return stripe.webhooks.constructEvent(
        payload,
        sig,
        webhookSecret
    );
};

const createCustomer = async (email, userId) => {
    try {
        return await stripe.customers.create({
            email: email,
            metadata: { userId: userId }
        });
    } catch (err) {
        console.error('Stripe customer creation error:', err);
        throw err;
    }
};

module.exports = {
    createCheckoutSession,
    constructWebhookEvent,
    createCustomer
};