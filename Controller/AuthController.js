const AuthModel = require('../Models/AuthModel');

class AuthController {
  static async loginAdmin(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: "Email and password are required" 
        });
      }

      console.log("🔐 Admin login attempt:", email);

      const result = await AuthModel.adminLogin(email, password);
      
      if (result.success) {
        console.log("✅ Admin login successful");
        res.json({ 
          success: true, 
          token: result.token,
          message: "Login successful",
          uid: result.uid
        });
      } else {
        console.log("❌ Admin login failed:", result.error);
        res.status(401).json({ success: false, error: result.error });
      }
      
    } catch (error) {
      console.error("💥 Controller Error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  }
}

module.exports = AuthController;