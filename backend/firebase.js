const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config();

let serviceAccount;

try {
    // Try to require the service account key file
    serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
    console.warn("⚠️  FIREBASE WARNING: 'serviceAccountKey.json' not found in backend folder.");
}

if (serviceAccount) {
    try {
        if (!admin.apps.length) { // Prevent multiple init
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("🔥 Firebase Admin Initialized successfully");
        }
    } catch (e) {
        console.error("❌ Firebase Initialization Error:", e.message);
    }
} else {
    console.warn("⚠️  Cannot initialize Firebase without credentials.");
}

// Export db AND admin (for Auth)
let db;
try {
    db = admin.firestore();
} catch (e) {
    console.warn("⚠️  Firestore not initialized (missing creds?)");
    db = { collection: () => ({ doc: () => ({ get: () => Promise.reject("Firebase not connected") }) }) };
}

module.exports = { db, admin };
