const db = require('./firebase');

async function testConnection() {
    console.log("🔍 Testing Firebase Firestore Connection...");
    try {
        // Try to list collections (requires admin privileges typically implies connection success)
        const collections = await db.listCollections();
        console.log("✅ SUCCESS: Connected to Firestore!");
        console.log("Collections found:", collections.map(c => c.id).join(', ') || 'None (DB is empty)');
    } catch (error) {
        console.error("❌ FAILED: Could not connect to Firestore.");
        console.error("Error Detail:", error.message);
        console.log("💡 TIP: Check if 'serviceAccountKey.json' exists in this folder.");
        console.log("💡 TIP: Ensure your Service Account has 'Firebase Admin SDK Administrator Service Agent' roles.");
    }
}

testConnection();
