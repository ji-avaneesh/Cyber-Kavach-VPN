const router = require('express').Router();
const Razorpay = require('razorpay');
console.log("💰 Payment Route Loaded - Updated Version (Firebase)");
const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// DEMO MODE - Set to false for real Razorpay (test keys will be used)
const DEMO_MODE = true;

// 1. CREATE ORDER (With Double Payment Check)
router.post('/order', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Double Payment Check
        if (user.isPro) {
            return res.status(400).json({ message: "You are already a Pro member!" });
        }

        if (DEMO_MODE) {
            // Return mock order in demo mode
            return res.json({
                id: `DEMO_ORDER_${Date.now()}`,
                amount: req.body.amount * 100,
                currency: "INR",
                receipt: "demo_receipt"
            });
        }

        const options = {
            amount: req.body.amount * 100, // Amount in paise
            currency: "INR",
            receipt: "receipt_" + Math.random().toString(36).substring(7),
            notes: {
                userId: user.id, // Store userId in notes for Webhook to use
                plan: req.body.plan || 'monthly'
            }
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(500).json({ message: error.error?.description || "Razorpay Error: Check Backend Logs" });
    }
});

// 2. VERIFY PAYMENT (Hardened)
router.post('/verify', verifyToken, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Missing Fields Check
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: "Missing required payment fields" });
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            try {
                // Payment Verified - Update User
                const updatedUser = await User.update(req.user.id, {
                    isPro: true,
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    subscriptionStatus: 'active',
                    subscriptionStartDate: new Date(),
                    subscriptionPlan: 'pro'
                });

                if (!updatedUser) {
                    return res.status(500).json({ message: "Payment valid, but failed to update user profile." });
                }

                return res.status(200).json({ message: "Payment verified successfully" });
            } catch (dbError) {
                console.error("DB Save Error:", dbError);
                return res.status(500).json({ message: "Database error while updating profile." });
            }
        } else {
            // Signature Mismatch
            return res.status(400).json({ message: "Invalid signature sent!" });
        }
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

// 3. WEBHOOK (For Failsafe & Refunds)
router.post('/webhook', async (req, res) => {
    // Webhooks are public, so NO verifyToken middleware here.
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    // Validate Signature
    if (digest !== req.headers['x-razorpay-signature']) {
        return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log('Webhook Event Received:', event);

    try {
        if (event === 'payment.captured') {
            const paymentEntity = payload.payment.entity;
            const userId = paymentEntity.notes.userId;

            if (userId) {
                await User.update(userId, {
                    isPro: true,
                    razorpayPaymentId: paymentEntity.id,
                    subscriptionStatus: 'active'
                });
                console.log(`User ${userId} upgraded via Webhook.`);
            }
        } else if (event === 'refund.processed') {
            const paymentEntity = payload.payment.entity;
            const userId = paymentEntity.notes.userId;

            if (userId) {
                await User.update(userId, {
                    isPro: false,
                    subscriptionStatus: 'cancelled'
                });
                console.log(`User ${userId} downgraded due to Refund.`);
            }
        }

        res.json({ status: 'ok' });

    } catch (err) {
        console.error('Webhook Error:', err);
        res.json({ status: 'error_logged' });
    }
});

// 4. MANUAL PAYMENT VERIFICATION (MOCK)
router.post('/manual', verifyToken, async (req, res) => {
    try {
        const { transactionId } = req.body;

        if (!transactionId || transactionId.length < 6) {
            return res.status(400).json({ message: "Invalid Transaction ID" });
        }

        await User.update(req.user.id, {
            isPro: true,
            razorpayPaymentId: "MANUAL_" + transactionId,
            subscriptionStatus: 'active'
        });

        res.json({ success: true, message: "Manual verification successful" });

    } catch (error) {
        console.error("Manual Payment Error:", error);
        res.status(500).send("Server Error");
    }
});

// 5. MOCK PAYMENT (FOR TESTING WITHOUT RAZORPAY)
router.post('/mock-payment', verifyToken, async (req, res) => {
    try {
        const { amount, plan } = req.body;

        console.log(`🧪 MOCK PAYMENT: User ${req.user.id} attempting payment for plan: ${plan}, amount: ${amount}`);

        setTimeout(async () => {
            try {
                // Update user to Pro
                await User.update(req.user.id, {
                    isPro: true,
                    razorpayPaymentId: `MOCK_${Date.now()}`,
                    razorpayOrderId: `MOCK_ORDER_${Date.now()}`,
                    subscriptionStatus: 'active',
                    subscriptionPlan: plan || 'pro',
                    subscriptionStartDate: new Date()
                });

                console.log(`✅ MOCK PAYMENT SUCCESS: User ${req.user.id} upgraded to Pro`);
            } catch (dbError) {
                console.error("DB Error in mock payment:", dbError);
            }
        }, 500);

        res.json({
            success: true,
            message: "Mock payment successful",
            mockPaymentId: `MOCK_PAY_${Date.now()}`,
            mockOrderId: `MOCK_ORDER_${Date.now()}`
        });

    } catch (error) {
        console.error("Mock Payment Error:", error);
        res.status(500).json({ message: "Mock payment failed" });
    }
});

module.exports = router;
