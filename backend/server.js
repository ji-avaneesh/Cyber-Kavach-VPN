const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin (Side effect)
require('./firebase');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Import Routes
const authRoute = require('./routes/auth');
const userRoute = require('./routes/user');
const paymentRoute = require('./routes/payment');
const scanRoute = require('./routes/scan');

// Route Middlewares
app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/payment', paymentRoute);
app.use('/api/scan', scanRoute);

// Public Config Route (Safe to expose Key ID)
app.get('/api/config', (req, res) => {
    res.json({ razorpayKeyId: process.env.RAZORPAY_KEY_ID });
});

app.get('/', (req, res) => {
    res.send('Fire Kavach API is running (Firebase Edition)');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server up and running on port ${PORT}`));
