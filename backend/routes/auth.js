const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { admin } = require('../firebase'); // Import Admin SDK for Token Verification

// =======================
// 1. REGISTER ROUTE (with Email Verification)
// =======================
router.post('/register', async (req, res) => {
    console.log("➡️ Register Request Received:", req.body);
    try {
        const { email, password, name } = req.body;

        // Check if user already exists
        const userExists = await User.findByEmail(email);
        if (userExists) return res.status(400).json({ message: 'Email already exists' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create new user
        const savedUser = await User.create({
            name,
            email,
            password: hashedPassword,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires
        });

        // Send verification email
        try {
            if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
                await sendVerificationEmail(email, verificationToken, name);
                console.log("✅ Verification email sent to:", email);
            }
        } catch (emailErr) {
            console.log("⚠️ Email sending failed:", emailErr.message);
        }

        // Create Token
        const token = jwt.sign({ id: savedUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: savedUser.id,
                name: savedUser.name,
                email: savedUser.email,
                isPro: savedUser.isPro,
                isEmailVerified: savedUser.isEmailVerified
            },
            message: 'Account created! Please check your email to verify your account.'
        });

    } catch (err) {
        console.error("❌ Register Error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// =======================
// 2. LOGIN ROUTE
// =======================
router.post('/login', async (req, res) => {
    console.log("➡️ Login Request Received:", req.body);
    try {
        const { email, password } = req.body;

        // Check user
        const user = await User.findByEmail(email);
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // Check password (support both hashed and plain for backward compatibility)
        let isPasswordValid = false;
        // Check if password exists (might be Google-only user attempting password login)
        if (!user.password) {
            return res.status(400).json({ message: 'This account was created with Google. Please login with Google.' });
        }

        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            isPasswordValid = await bcrypt.compare(password, user.password);
        } else {
            isPasswordValid = (password === user.password);
        }

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update last login
        await User.update(user.id, { lastLogin: new Date() });

        // Create Token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isPro: user.isPro,
                isEmailVerified: user.isEmailVerified,
                subscriptionPlan: user.subscriptionPlan,
                subscriptionStatus: user.subscriptionStatus
            }
        });

    } catch (err) {
        console.error("❌ Login Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// =======================
// 2.5 GOOGLE LOGIN ROUTE
// =======================
router.post('/google-login', async (req, res) => {
    console.log("➡️ Google Login Request Received");
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: 'No ID Token provided' });
        }

        // 1. Verify Google Token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;

        console.log(`✅ Google Token Verified for: ${email}`);

        // 2. Check if user exists
        let user = await User.findByEmail(email);
        let token;

        if (user) {
            // User exists - Login
            await User.update(user.id, {
                lastLogin: new Date(),
                avatar: user.avatar || picture, // Update avatar if missing
                googleId: uid,
                isEmailVerified: true
            });
        } else {
            // User does NOT exist - Register
            console.log(`🆕 Creating new user from Google: ${email}`);

            user = await User.create({
                name: name || 'Google User',
                email: email,
                password: '', // No password for Google users
                isEmailVerified: true, // Google emails are verified
                avatar: picture,
                googleId: uid
            });
        }

        // 3. Generate Our APP Token (JWT)
        // This unifies the session logic for web & extension
        token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isPro: user.isPro,
                isEmailVerified: user.isEmailVerified,
                avatar: user.avatar,
                subscriptionPlan: user.subscriptionPlan
            },
            message: 'Google Login Successful!'
        });

    } catch (err) {
        console.error("❌ Google Login Error:", err.message);
        res.status(401).json({ message: 'Invalid Google Token' });
    }
});

// =======================
// 3. VERIFY EMAIL
// =======================
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findByVerificationToken(token);

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        await User.update(user.id, {
            isEmailVerified: true,
            emailVerificationToken: null,
            emailVerificationExpires: null
        });

        res.json({ message: 'Email verified successfully! You can now login.' });

    } catch (err) {
        console.error("❌ Email Verification Error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// =======================
// 3.5 RESEND VERIFICATION EMAIL
// =======================
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await User.update(user.id, {
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires
        });

        // Send email
        try {
            if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
                await sendVerificationEmail(email, verificationToken, user.name);
                console.log("✅ Verification email resent to:", email);
            }
        } catch (emailErr) {
            console.log("⚠️ Email sending failed:", emailErr.message);
        }

        res.json({ message: 'Verification email resent successfully' });

    } catch (err) {
        console.error("❌ Resend Verification Error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// =======================
// 4. FORGOT PASSWORD
// =======================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'No account with that email exists' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await User.update(user.id, {
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetExpires
        });

        // Send reset email
        try {
            if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
                await sendPasswordResetEmail(email, resetToken, user.name);
                console.log("✅ Password reset email sent to:", email);
            }
        } catch (emailErr) {
            console.log("⚠️ Email sending failed:", emailErr.message);
        }

        res.json({
            message: 'Password reset link sent to your email',
            resetToken: resetToken // Remove in production
        });

    } catch (err) {
        console.error("❌ Forgot Password Error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// =======================
// 5. RESET PASSWORD
// =======================
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findByResetToken(token);

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.update(user.id, {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null
        });

        res.json({ message: 'Password reset successful! You can now login with your new password.' });

    } catch (err) {
        console.error("❌ Reset Password Error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
