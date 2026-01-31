const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

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

// =======================
// 1. GET User Profile
// =======================
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Build response manually to exclude password
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            company: user.company,
            address: user.address,
            avatar: user.avatar,
            isPro: user.isPro,
            isEmailVerified: user.isEmailVerified,
            subscriptionPlan: user.subscriptionPlan,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionStartDate: user.subscriptionStartDate,
            subscriptionEndDate: user.subscriptionEndDate,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// =======================
// 2. UPDATE User Profile
// =======================
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { name, phone, company, address, avatar } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update allowed fields
        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (company) updateData.company = company;
        if (address) updateData.address = address;
        if (avatar) updateData.avatar = avatar;

        const updatedUser = await User.update(req.user.id, updateData);

        res.json({
            message: 'Profile updated successfully',
            user: {
                name: updatedUser.name,
                phone: updatedUser.phone,
                company: updatedUser.company,
                address: updatedUser.address,
                avatar: updatedUser.avatar
            }
        });
    } catch (err) {
        console.error("❌ Update Profile Error:", err);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// =======================
// 3. CHANGE PASSWORD
// =======================
router.post('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Verify current password
        let isPasswordValid = false;
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        } else {
            isPasswordValid = (currentPassword === user.password);
        }

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash and save new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.update(req.user.id, { password: hashedPassword });

        res.json({ message: 'Password changed successfully' });

    } catch (err) {
        console.error("❌ Change Password Error:", err);
        res.status(500).json({ message: 'Error changing password' });
    }
});

// =======================
// 4. GET Subscription Info
// =======================
router.get('/subscription', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            isPro: user.isPro,
            plan: user.subscriptionPlan,
            status: user.subscriptionStatus,
            startDate: user.subscriptionStartDate,
            endDate: user.subscriptionEndDate,
            daysRemaining: user.subscriptionEndDate
                ? Math.ceil((new Date(user.subscriptionEndDate) - new Date()) / (1000 * 60 * 60 * 24))
                : 0
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching subscription' });
    }
});

// =======================
// 5. CANCEL Subscription
// =======================
router.post('/subscription/cancel', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.isPro) {
            return res.status(400).json({ message: 'You do not have an active subscription' });
        }

        const updatedUser = await User.update(req.user.id, { subscriptionStatus: 'cancelled' });

        res.json({
            message: 'Subscription cancelled. You can continue using Pro features until the end of your billing period.',
            endDate: updatedUser.subscriptionEndDate
        });
    } catch (err) {
        res.status(500).json({ message: 'Error cancelling subscription' });
    }
});

// =======================
// 6. GET Payment History
// =======================
router.get('/payment-history', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            payments: user.paymentHistory || [],
            totalSpent: user.paymentHistory?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching payment history' });
    }
});

// =======================
// 7. DOWNLOAD Invoice
// =======================
router.get('/invoice/:paymentId', verifyToken, async (req, res) => {
    try {
        const { paymentId } = req.params;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const payment = user.paymentHistory?.find(p => p.paymentId === paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Generate simple invoice data
        res.json({
            invoiceNumber: `INV-${payment.paymentId}`,
            date: payment.date,
            customerName: user.name,
            customerEmail: user.email,
            plan: payment.plan,
            amount: payment.amount,
            paymentId: payment.paymentId,
            orderId: payment.orderId,
            status: payment.status
        });

    } catch (err) {
        res.status(500).json({ message: 'Error generating invoice' });
    }
});

// =======================
// 8. DELETE Account
// =======================
router.delete('/account', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await User.delete(req.user.id);

        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting account' });
    }
});

module.exports = router;
