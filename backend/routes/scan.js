const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ScanLog = require('../models/ScanLog');

// Middleware to verify token (Reusable)
const verifyToken = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).send('Access Denied');

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
};

// Rate limiting helper for Free users
const checkRateLimit = async (userId) => {
    const scanCount = await ScanLog.countTodayScans(userId);
    // Limit: 10 scans per day for free users
    return scanCount < 10;
};

// POST /api/scan/link
router.post('/link', verifyToken, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ message: "URL is required" });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        let scanResult = { status: 'SAFE', message: 'No threats found.' };
        let scanType = 'BASIC';

        if (user.isPro) {
            // ==========================
            // DEEP SCAN LOGIC (PRO)
            // ==========================
            scanType = 'DEEP';

            // Simulation of AI Analysis
            const suspiciousKeywords = ['phishing', 'betting', 'hack', 'free-money'];
            const isSuspicious = suspiciousKeywords.some(keyword => url.includes(keyword));

            if (isSuspicious) {
                scanResult = {
                    status: 'SUSPICIOUS',
                    message: 'Deep AI scan detected potential phishing patterns.'
                };
            } else {
                scanResult = {
                    status: 'SAFE',
                    message: 'Deep AI scan validated this link as safe. Certificate valid. No malware signatures.'
                };
            }

        } else {
            // ==========================
            // BASIC SCAN LOGIC (FREE)
            // ==========================

            // 1. Check Rate Limit
            const canScan = await checkRateLimit(user.id);
            if (!canScan) {
                return res.status(429).json({
                    message: "Daily scan limit reached. Upgrade to Pro for unlimited AI scans.",
                    upgradeRequired: true
                });
            }

            // 2. Simple Blacklist Check
            const blacklist = ['malicious-site.com', 'bad-link.net'];
            if (blacklist.some(bad => url.includes(bad))) {
                scanResult = {
                    status: 'DANGEROUS',
                    message: 'Link found in global blacklist.'
                };
            } else {
                scanResult = {
                    status: 'SAFE',
                    message: 'Basic check passed (Blacklist check only).'
                };
            }
        }

        // Log the scan
        await ScanLog.create({
            userId: user.id,
            url: url,
            result: scanResult.status,
            scanType: scanType,
            details: scanResult.message
        });

        res.json({
            url,
            ...scanResult,
            scanType
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error during scan" });
    }
});

module.exports = router;
