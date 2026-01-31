const http = require('http');

function postRequest(path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 5001,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => { responseBody += chunk; });
            res.on('end', () => {
                resolve({ status: res.statusCode, body: JSON.parse(responseBody || '{}') });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

async function runTest() {
    const email = `verify_test_${Date.now()}@test.com`;
    const password = 'password123';

    console.log(`\n--- 1. Registering User (${email}) ---`);
    try {
        const regRes = await postRequest('/api/auth/register', {
            name: 'Verify Test',
            email,
            password
        });
        console.log(`Status: ${regRes.status}`);
        console.log(`Body:`, regRes.body);

        if (regRes.status !== 200) {
            console.error("Registration failed. Aborting.");
            return;
        }
    } catch (e) {
        console.error("Registration error:", e);
        return;
    }

    console.log(`\n--- 2. Resending Verification Email ---`);
    try {
        const resendRes = await postRequest('/api/auth/resend-verification', {
            email
        });
        console.log(`Status: ${resendRes.status}`);
        console.log(`Body:`, resendRes.body);
    } catch (e) {
        console.error("Resend error:", e);
    }
}

runTest();
