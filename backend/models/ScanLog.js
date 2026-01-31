const { db } = require('../firebase');
const collection = db.collection('scan_logs');

const ScanLog = {
    create: async (data) => {
        const doc = {
            ...data,
            createdAt: new Date()
        };
        const res = await collection.add(doc);
        return { id: res.id, ...doc };
    },

    /**
     * Count scans for a user today (Safe Rate Limiting)
     * @param {String} userId 
     */
    countTodayScans: async (userId) => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        try {
            const snapshot = await collection
                .where('userId', '==', userId)
                .where('createdAt', '>=', startOfDay)
                .get();

            return snapshot.size;
        } catch (e) {
            console.error("Scan Log Count Error:", e);
            return 0; // Fail open
        }
    }
};

module.exports = ScanLog;
