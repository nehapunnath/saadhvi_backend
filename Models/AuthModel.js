const { admin } = require('../Config/firebaseAdmin');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const OtpModel = require('./OtpModel');

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

    static async sendPhoneOtp(phoneNumber) {
    return await OtpModel.sendOtp(phoneNumber);
  }

  // Verify OTP and authenticate/create user
  // Models/AuthModel.js - Fix the authenticateWithPhone method

static async authenticateWithPhone(phoneNumber, otp, name = null) {
  try {
    // 1. Verify OTP
    const otpResult = await OtpModel.verifyOtp(phoneNumber, otp);
    if (!otpResult.success) {
      return otpResult;
    }
    
    const cleanedPhone = otpResult.phoneNumber;
    
    // 2. Check if user exists with this phone number
    let userRecord;
    try {
      // Try to find user by phone number
      userRecord = await admin.auth().getUserByPhoneNumber(`+${cleanedPhone}`);
      console.log(`✅ Existing user found with phone: ${cleanedPhone}`);
    } catch (error) {
      // User doesn't exist, create new user
      if (error.code === 'auth/user-not-found') {
        // Create user with ONLY phone number - NO email field
        const userData = {
          phoneNumber: `+${cleanedPhone}`,
          displayName: name || `User_${cleanedPhone.slice(-4)}`
          // ⚠️ Do NOT include email: null - this causes the error!
        };
        
        userRecord = await admin.auth().createUser(userData);
        console.log(`✅ New user created with phone: ${cleanedPhone}`);
        
        // Store additional data in Realtime Database
        await admin.database().ref('users/' + userRecord.uid).set({
          phoneNumber: cleanedPhone,
          name: name || `User_${cleanedPhone.slice(-4)}`,
          createdAt: new Date().toISOString(),
          role: 'user',
          authMethod: 'phone'
        });
      } else {
        throw error;
      }
    }
    
    // 3. Generate custom token
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    
    // 4. Clear OTP from store
    OtpModel.clearOtp(cleanedPhone);
    
    // 5. Get user data
    const userSnapshot = await admin.database().ref('users/' + userRecord.uid).once('value');
    const userData = userSnapshot.val() || {};
    
    console.log(`✅ Phone authentication successful for ${cleanedPhone}`);
    
    return {
      success: true,
      token: customToken,
      uid: userRecord.uid,
      phoneNumber: cleanedPhone,
      name: userData.name || userRecord.displayName,
      isNewUser: !userData.createdAt // Flag if new user
    };
    
  } catch (error) {
    console.error("❌ Phone Auth Error:", error);
    return { success: false, error: error.message };
  }
}

  // Link phone to existing email account
  // Models/AuthModel.js - Fix linkPhoneToAccount method

static async linkPhoneToAccount(uid, phoneNumber, otp) {
  try {
    // Verify OTP
    const otpResult = await OtpModel.verifyOtp(phoneNumber, otp);
    if (!otpResult.success) {
      return otpResult;
    }
    
    const cleanedPhone = otpResult.phoneNumber;
    
    // Update user with phone number
    await admin.auth().updateUser(uid, {
      phoneNumber: `+${cleanedPhone}`
      // Don't include email field here either
    });
    
    // Update database
    await admin.database().ref('users/' + uid).update({
      phoneNumber: cleanedPhone,
      phoneVerified: true,
      phoneLinkedAt: new Date().toISOString()
    });
    
    OtpModel.clearOtp(cleanedPhone);
    
    return { success: true, message: 'Phone number linked successfully' };
    
  } catch (error) {
    console.error("❌ Link Phone Error:", error);
    return { success: false, error: error.message };
  }
}

  static async verifyToken(idToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken, true); // checkRevoked: true
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

  // 🔥 USER REGISTRATION
  static async registerUser(username, email, password) {
    try {
      // 1. Create user with email and password using Client SDK
      const userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
      console.log("✅ User created with Client SDK");
      
      const uid = userCredential.user.uid;
      
      // 2. Store additional user data in Realtime Database
      await admin.database().ref('users/' + uid).set({
        username: username,
        email: email,
        createdAt: new Date().toISOString(),
        role: 'user'
      });

      // 3. Generate custom token that never expires
      const customToken = await admin.auth().createCustomToken(uid);
      
      console.log("✅ User registration successful");
      
      return { 
        success: true, 
        token: customToken,
        uid: uid,
        username: username
      };
      
    } catch (error) {
      console.error("🔥 Registration Error:", error.message);
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, error: "Email already exists" };
      }
      if (error.code === 'auth/weak-password') {
        return { success: false, error: "Password is too weak" };
      }
      return { success: false, error: "Registration failed" };
    }
  }

  // 🔥 USER LOGIN
  static async loginUser(email, password) {
    try {
      // 1. Verify password with CLIENT SDK
      const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
      console.log("✅ Password verified with Client SDK");
      
      const uid = userCredential.user.uid;
      
      // 2. Get user data from Realtime Database
      const userSnapshot = await admin.database().ref('users/' + uid).once('value');
      const userData = userSnapshot.val();
      
      if (!userData) {
        return { success: false, error: "User data not found" };
      }

      // 3. Generate custom token that never expires
      const customToken = await admin.auth().createCustomToken(uid);
      
      console.log("✅ User login successful");
      
      return { 
        success: true, 
        token: customToken,
        uid: uid,
        username: userData.username,
        email: userData.email
      };
      
    } catch (error) {
      console.error("🔥 Login Error:", error.message);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return { success: false, error: "Invalid email or password" };
      }
      return { success: false, error: "Login failed" };
    }
  }

  // 🔥 FIXED: ADMIN LOGIN WITH CUSTOM TOKEN (NO EXPIRATION)
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

      // 3. GENERATE CUSTOM TOKEN that never expires
      const customToken = await admin.auth().createCustomToken(uid);
      
      console.log("✅ Admin login successful - custom token generated");
      
      return { 
        success: true, 
        token: customToken,
        uid: uid 
      };
      
    } catch (error) {
      console.error("🔥 Admin Login Error:", error.message);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return { success: false, error: "Invalid credentials" };
      }
      return { success: false, error: "Invalid credentials" };
    }
  }

  // 🔥 UPDATE TOKEN VERIFICATION TO USE CUSTOM TOKENS
  static async verifyCustomToken(customToken) {
    try {
      // For custom tokens, we need to verify them differently
      const decodedToken = await admin.auth().verifyIdToken(customToken);
      return { success: true, decodedToken };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }


}

module.exports = AuthModel;