// Controller/OtpController.js
const AuthModel = require('../Models/AuthModel');
const OtpModel = require('../Models/OtpModel');

class OtpController {
  // Send OTP to phone number
  static async sendOtp(req, res) {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ 
          success: false, 
          error: 'Phone number is required' 
        });
      }
      
      // Basic phone validation
      const cleanedNumber = OtpModel.cleanPhoneNumber(phoneNumber);
      if (cleanedNumber.length < 10) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid phone number' 
        });
      }
      
      console.log(`📱 Sending OTP to: ${cleanedNumber}`);
      
      const result = await AuthModel.sendPhoneOtp(cleanedNumber);
      
      if (result.success) {
        return res.json({ 
          success: true, 
          message: 'OTP sent successfully',
          // In development, you can return OTP for testing
          ...(process.env.NODE_ENV === 'development' && { debugOtp: 'Check server console' })
        });
      } else {
        return res.status(500).json({ success: false, error: result.error });
      }
      
    } catch (error) {
      console.error('💥 Send OTP Controller Error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send OTP' 
      });
    }
  }
  
  // Verify OTP and login/register
  static async verifyOtpAndLogin(req, res) {
    try {
      const { phoneNumber, otp, name } = req.body;
      
      if (!phoneNumber || !otp) {
        return res.status(400).json({ 
          success: false, 
          error: 'Phone number and OTP are required' 
        });
      }
      
      console.log(`🔐 Verifying OTP for: ${phoneNumber}`);
      
      const result = await AuthModel.authenticateWithPhone(phoneNumber, otp, name);
      
      if (result.success) {
        console.log('✅ Phone authentication successful');
        return res.json({
          success: true,
          token: result.token,
          uid: result.uid,
          phoneNumber: result.phoneNumber,
          name: result.name,
          isNewUser: result.isNewUser,
          message: 'Authentication successful'
        });
      } else {
        return res.status(401).json({ success: false, error: result.error });
      }
      
    } catch (error) {
      console.error('💥 Verify OTP Controller Error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Verification failed' 
      });
    }
  }
  
  // Link phone to existing account (for logged-in users)
  static async linkPhone(req, res) {
    try {
      const { phoneNumber, otp } = req.body;
      const uid = req.user?.uid; // From verifyUser middleware
      
      if (!uid) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }
      
      if (!phoneNumber || !otp) {
        return res.status(400).json({ 
          success: false, 
          error: 'Phone number and OTP are required' 
        });
      }
      
      const result = await AuthModel.linkPhoneToAccount(uid, phoneNumber, otp);
      
      if (result.success) {
        return res.json({ success: true, message: result.message });
      } else {
        return res.status(400).json({ success: false, error: result.error });
      }
      
    } catch (error) {
      console.error('💥 Link Phone Controller Error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to link phone number' 
      });
    }
  }
}

module.exports = OtpController;