// functions/src/Controller/AuthController.js
const AuthModel = require('../Models/AuthModel');

class AuthController {
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: "Email and password are required" 
        });
      }

      console.log("🔐 Login attempt:", email);

      // Try admin login first
      const adminResult = await AuthModel.adminLogin(email, password);
      
      if (adminResult.success) {
        console.log("✅ Admin login successful");
        return res.json({ 
          success: true, 
          token: adminResult.token,
          message: "Login successful",
          uid: adminResult.uid,
          isAdmin: true
        });
      }

      // If not admin, try user login
      const userResult = await AuthModel.loginUser(email, password);
      
      if (userResult.success) {
        console.log("✅ User login successful");
        return res.json({ 
          success: true, 
          token: userResult.token,
          message: "Login successful",
          uid: userResult.uid,
          username: userResult.username,
          email: userResult.email,
          isAdmin: false
        });
      }

      console.log("❌ Login failed:", userResult.error);
      return res.status(401).json({ success: false, error: userResult.error });
      
    } catch (error) {
      console.error("💥 Login Controller Error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  }

  static async registerUser(req, res) {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: "Username, email and password are required" 
        });
      }

      console.log("👤 User registration attempt:", email);

      const result = await AuthModel.registerUser(username, email, password);
      
      if (result.success) {
        console.log("✅ User registration successful");
        return res.json({ 
          success: true, 
          token: result.token,
          message: "Registration successful",
          uid: result.uid,
          username: result.username,
          isAdmin: false
        });
      } else {
        console.log("❌ User registration failed:", result.error);
        return res.status(400).json({ success: false, error: result.error });
      }
      
    } catch (error) {
      console.error("💥 Registration Controller Error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  }
}

module.exports = AuthController;