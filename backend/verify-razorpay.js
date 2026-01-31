const Razorpay = require('razorpay');
const dotenv = require('dotenv');

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function testKeys() {
    try {
        console.log("Testing Razorpay Keys...");
        console.log(`Key ID: ${process.env.RAZORPAY_KEY_ID}`);
        // Don't log full secret for security
        console.log(`Key Secret Length: ${process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.length : 0}`);

        const options = {
            amount: 100, // 1 rupee
            currency: "INR",
            receipt: "test_receipt"
        };
        const order = await razorpay.orders.create(options);
        console.log("✅ Success! Order created:", order.id);
    } catch (error) {
        console.error("❌ Razorpay Error:", error);
    }
}

testKeys();
