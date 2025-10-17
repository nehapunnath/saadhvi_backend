const { admin } = require('../Config/firebaseAdmin');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// 🔥 CLIENT CONFIG (for password verification)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_WEB_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID
};

// Initialize CLIENT app
const clientApp = initializeApp(firebaseConfig);
const clientAuth = getAuth(clientApp);

class AuthModel {
  static async verifyToken(idToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return { success: true, decodedToken };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async isAdmin(uid) {
    try {
      const user = await admin.auth().getUser(uid);
      return user.customClaims && user.customClaims.admin === true;
    } catch (error) {
      console.error("🔥 isAdmin Error:", error.message);
      return false;
    }
  }

  // 🔥 FIXED: CLIENT SDK FOR PASSWORD + ADMIN SDK FOR TOKEN
  static async adminLogin(email, password) {
    try {
      // 1. VERIFY PASSWORD with CLIENT SDK
      const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
      console.log("✅ Password verified with Client SDK");
      
      const uid = userCredential.user.uid;
      
      // 2. CHECK ADMIN with Admin SDK
      const isAdmin = await this.isAdmin(uid);
      if (!isAdmin) {
        console.log("❌ User is not an admin");
        await clientAuth.signOut(); // Clean up
        return { success: false, error: "Not an admin user" };
      }

      // 3. GENERATE SECURE TOKEN with Admin SDK
      const idToken = await userCredential.user.getIdToken();
      
      console.log("✅ Admin login successful - token generated");
      
      return { 
        success: true, 
        token: idToken,
        uid: uid 
      };
      
    } catch (error) {
      console.error("🔥 Login Error:", error.message);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return { success: false, error: "Invalid credentials" };
      }
      return { success: false, error: "Invalid credentials" };
    }
  }
}

module.exports = AuthModel;