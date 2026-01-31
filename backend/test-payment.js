const crypto = require('crypto');
const http = require('http');

// Configuration - Verify these match your .env or testing environment
const KEY_SECRET = 'YOUR_KEY_SECRET'; // Replace or use process.env in a real test runner
const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api/payment`;

// NOTE: For this script to work, you must update KEY_SECRET above to match 
// what is in your backend/.env (RAZORPAY_KEY_SECRET).

// Helper to make HTTP requests
function request(endpoint, method, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: `/api/payment/${endpoint}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let body = {};
                try {
                    body = JSON.parse(data || '{}');
                } catch (e) {
                    body = { raw_response: data };
                }
                resolve({
                    status: res.statusCode,
                    body: body
                });
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// Helper to generate signature
function generateSignature(orderId, paymentId) {
    const text = orderId + "|" + paymentId;
    return crypto.createHmac('sha256', KEY_SECRET).update(text).digest('hex');
}

// Helper to generate Webhook signature
function generateWebhookSignature(payload) {
    return crypto.createHmac('sha256', KEY_SECRET).update(JSON.stringify(payload)).digest('hex');
}

async function runTests() {
    console.log("🚀 Starting Backend Payment Tests...\n");

    // TEST 1: verify - Missing Fields
    console.log("Test 1: /verify - Missing Fields");
    try {
        const res = await request('verify', 'POST', { razorpay_order_id: '123' }); // Missing payment_id/sig
        if (res.status === 400) console.log("✅ Passed: Correctly blocked missing fields.");
        else console.log(`❌ Failed: Expected 400, got ${res.status}`);
    } catch (e) { console.log("❌ Error:", e.message); }

    // TEST 2: verify - Signature Mismatch
    console.log("\nTest 2: /verify - Signature Mismatch");
    try {
        const res = await request('verify', 'POST', {
            razorpay_order_id: 'order_test_123',
            razorpay_payment_id: 'pay_test_123',
            razorpay_signature: 'fake_signature'
        }, { 'auth-token': 'MOCK_TOKEN_NEEDED' });
        // Note: This might fail with 401 if we don't pass a valid token. 
        // For strict backend testing, we usually login first.
        // But let's assume we want to test the signature logic roughly.
        // Actually, the route uses verifyToken middleware, so we DO need a token.
        // Skipping deep verification without login flow in this simple script.
        console.log("⚠️ Skipped: Requires valid Auth Token for full test.");
    } catch (e) { console.log("❌ Error:", e.message); }

    // TEST 3: Webhook - Signature Verification (No Token Needed)
    console.log("\nTest 3: /webhook - Invalid Signature");
    try {
        const res = await request('webhook', 'POST', { event: 'payment.captured' }, { 'x-razorpay-signature': 'bad_sig' });
        if (res.status === 400) console.log("✅ Passed: Correctly rejected invalid webhook signature.");
        else console.log(`❌ Failed: Expected 400, got ${res.status}`);
    } catch (e) { console.log("❌ Error:", e.message); }

    // TEST 4: Webhook - Valid Signature (Mock Capture)
    console.log("\nTest 4: /webhook - Valid Event");
    try {
        const payload = {
            event: "payment.captured",
            payload: {
                payment: {
                    entity: {
                        id: "pay_mock_123",
                        notes: { userId: "some_mongo_id" }
                    }
                }
            }
        };
        const sig = generateWebhookSignature(payload);
        const res = await request('webhook', 'POST', payload, { 'x-razorpay-signature': sig });

        // This might likely return 'error_logged' status or 200 depending on if "some_mongo_id" is valid
        if (res.status === 200) console.log("✅ Passed: Signature accepted.");
        else console.log(`❌ Failed: Got ${res.status}`);
    } catch (e) { console.log("❌ Error:", e.message); }

    console.log("\nDone.");
}

runTests();
