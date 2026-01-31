const { db } = require('../firebase'); // Destructure DB
const collection = db.collection('users');

/**
 * User Model for Firestore
 */
const User = {
  /**
   * Create a new user
   * @param {Object} userData 
   * @returns {Object} Created user with ID
   */
  create: async (userData) => {
    // Add timestamps
    const now = new Date();
    const data = {
      ...userData,
      createdAt: now,
      lastLogin: now,
      isPro: false,
      isEmailVerified: false,
      subscriptionPlan: 'free',
      subscriptionStatus: 'none',
      paymentHistory: [],
      // Default nulls for schema consistency
      phone: null,
      company: null,
      address: null,
      avatar: userData.avatar || null, // Allow avatar from Google
      subscriptionId: null,
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      razorpayOrderId: null,
      razorpayPaymentId: null,
      emailVerificationToken: userData.emailVerificationToken || null,
      emailVerificationExpires: userData.emailVerificationExpires || null,
      googleId: userData.googleId || null // Add Google ID support
    };

    const res = await collection.add(data);
    return { id: res.id, ...data };
  },

  /**
   * Find user by Email
   * @param {String} email 
   */
  findByEmail: async (email) => {
    const snapshot = await collection.where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  /**
   * Find user by ID
   * @param {String} id 
   */
  findById: async (id) => {
    try {
      const doc = await collection.doc(id).get();
      if (!doc.exists) return null;

      const data = doc.data();
      // Convert Timestamps to Dates if necessary (Firestore returns Timestamp)
      return { id: doc.id, ...convertTimestamps(data) };
    } catch (e) {
      console.error("Error finding user by ID:", e);
      return null;
    }
  },

  /**
   * Find by Verification Token
   */
  findByVerificationToken: async (token) => {
    // Note: This requires an index on emailVerificationToken if collection is large
    const snapshot = await collection.where('emailVerificationToken', '==', token).limit(1).get();
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Check expiry manually if not querying by it
    const expires = data.emailVerificationExpires ? data.emailVerificationExpires.toDate() : null;
    if (expires && expires < new Date()) return null; // Expired

    return { id: doc.id, ...convertTimestamps(data) };
  },

  /**
   * Find by Reset Token
   */
  findByResetToken: async (token) => {
    const snapshot = await collection.where('resetPasswordToken', '==', token).limit(1).get();
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    const expires = data.resetPasswordExpires ? data.resetPasswordExpires.toDate() : null;
    if (expires && expires < new Date()) return null;

    return { id: doc.id, ...convertTimestamps(data) };
  },

  /**
   * Update user (Partial update)
   * @param {String} id 
   * @param {Object} data 
   */
  update: async (id, data) => {
    await collection.doc(id).update(data);
    // fetch updated
    const updated = await collection.doc(id).get();
    return { id: updated.id, ...convertTimestamps(updated.data()) };
  },

  /**
   * Delete user
   */
  delete: async (id) => {
    await collection.doc(id).delete();
    return true;
  }
};

// Helper to convert Firestore Timestamps to JS Dates 
function convertTimestamps(data) {
  if (!data) return data;
  const res = { ...data };
  for (const key in res) {
    if (res[key] && typeof res[key].toDate === 'function') {
      res[key] = res[key].toDate();
    }
  }
  return res;
}

module.exports = User;
