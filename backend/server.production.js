const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

dotenv.config();

const app = express();

// ========================================
// SECURITY MIDDLEWARE
// ========================================

// 1. Helmet - Sets various HTTP headers for security
app.use(helmet({
    contentSecurityPolicy: false, // Disable for now, can be configured later
    crossOriginEmbedderPolicy: false
}));

// 2. CORS - Configure for production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? [
            process.env.FRONTEND_URL,
            'https://www.yourdomain.com',
            'https://yourdomain.com'
        ].filter(Boolean) // Remove undefined values
        : '*', // Allow all in development
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 3. Request Logging
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined')); // Detailed logs in production
} else {
    app.use(morgan('dev')); // Concise logs in development
}

// 4. Body Parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Rate Limiting - Prevent brute force attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Stricter rate limit for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    message: 'Too many login attempts, please try again later.',
    skipSuccessfulRequests: true // Don't count successful requests
});

// ========================================
// IMPORT ROUTES
// ========================================

const authRoute = require('./routes/auth');
const userRoute = require('./routes/user');
const paymentRoute = require('./routes/payment');
const scanRoute = require('./routes/scan');

// ========================================
// ROUTE MIDDLEWARES
// ========================================

// Auth routes with stricter rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoute);

// Other routes
app.use('/api/user', userRoute);
app.use('/api/payment', paymentRoute);
app.use('/api/scan', scanRoute);

// ========================================
// PUBLIC ROUTES
// ========================================

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        message: 'Fire Kavach API is running',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// Public Config Route (Safe to expose Key ID)
app.get('/api/config', (req, res) => {
    res.json({
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        environment: process.env.NODE_ENV || 'development'
    });
});

// ========================================
// ERROR HANDLING MIDDLEWARE
// ========================================

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Don't leak error details in production
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message;

    res.status(err.status || 500).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// ========================================
// DATABASE CONNECTION
// ========================================

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.log('⚠️ MongoDB URI not found in environment variables.');
            console.log('⚠️ Please set MONGO_URI in .env file');
            return;
        }

        if (process.env.MONGO_URI.includes('placeholder')) {
            console.log('⚠️ MongoDB URI is a placeholder. Please update .env with your actual MongoDB connection string.');
            console.log('⚠️ Starting server without DB connection for testing routes mock-up (DB functions will fail).');
            return;
        }

        await mongoose.connect(process.env.MONGO_URI, {
            // These options are no longer needed in Mongoose 6+, but including for compatibility
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB');
        console.log(`📊 Database: ${mongoose.connection.name}`);

    } catch (err) {
        console.error('❌ Could not connect to MongoDB:', err.message);

        // In production, exit if DB connection fails
        if (process.env.NODE_ENV === 'production') {
            console.error('🔴 Exiting due to database connection failure in production');
            process.exit(1);
        }
    }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err);
});

// ========================================
// START SERVER
// ========================================

connectDB();

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
    console.log('=====================================');
    console.log('🔥 Cyber Kavach Backend Server');
    console.log('=====================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Security: Helmet & Rate Limiting enabled`);
    console.log(`⏰ Started at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log('=====================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('🔴 HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('🔴 MongoDB connection closed');
            process.exit(0);
        });
    });
});

module.exports = app; // Export for testing
