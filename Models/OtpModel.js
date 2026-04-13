// Models/OtpModel.js
const { admin } = require('../Config/firebaseAdmin');

// In-memory store for OTPs (use Redis in production)
const otpStore = new Map();

class OtpModel {
  // Clean up expired OTPs every 5 minutes
  static startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of otpStore.entries()) {
        if (value.expiresAt < now) {
          otpStore.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  // Generate and send OTP
  static async sendOtp(phoneNumber) {
    try {
      // Clean phone number (remove spaces, +91, etc.)
      const cleanedNumber = this.cleanPhoneNumber(phoneNumber);
      
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP with 5-minute expiry
      otpStore.set(cleanedNumber, {
        otp: otp,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        attempts: 0,
        verified: false
      });

      console.log(`📱 Sending OTP to: ${cleanedNumber}`);
      console.log(`🔐 Generated OTP: ${otp}`);

      // Send via your SMS API
      const smsResult = await this.sendSmsViaApi(cleanedNumber, otp);
      
      if (!smsResult.success) {
        console.error(`❌ SMS sending failed for ${cleanedNumber}: ${smsResult.error}`);
        // In development, still return success so testing can continue
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚠️ [DEV MODE] Continuing with OTP: ${otp}`);
          return { success: true, message: 'OTP sent successfully (dev mode)', devOtp: otp };
        }
        throw new Error(smsResult.error || 'Failed to send OTP');
      }

      console.log(`✅ OTP sent successfully to ${cleanedNumber}`);
      return { success: true, message: 'OTP sent successfully' };
      
    } catch (error) {
      console.error(`❌ Send OTP Error:`, error);
      return { success: false, error: error.message };
    }
  }

  // Verify OTP
  static async verifyOtp(phoneNumber, otp) {
    try {
      const cleanedNumber = this.cleanPhoneNumber(phoneNumber);
      const storedData = otpStore.get(cleanedNumber);
      
      if (!storedData) {
        return { success: false, error: 'No OTP requested for this number. Please request a new OTP.' };
      }
      
      if (storedData.expiresAt < Date.now()) {
        otpStore.delete(cleanedNumber);
        return { success: false, error: 'OTP has expired. Please request a new one.' };
      }
      
      if (storedData.attempts >= 5) {
        otpStore.delete(cleanedNumber);
        return { success: false, error: 'Too many failed attempts. Please request a new OTP.' };
      }
      
      if (storedData.otp !== otp) {
        storedData.attempts++;
        otpStore.set(cleanedNumber, storedData);
        return { success: false, error: `Invalid OTP. ${5 - storedData.attempts} attempts remaining.` };
      }
      
      // Mark as verified but keep for session linking
      storedData.verified = true;
      otpStore.set(cleanedNumber, storedData);
      
      return { success: true, phoneNumber: cleanedNumber };
      
    } catch (error) {
      console.error("❌ Verify OTP Error:", error);
      return { success: false, error: error.message };
    }
  }

  // Check if phone is verified
  static isPhoneVerified(phoneNumber) {
    const cleanedNumber = this.cleanPhoneNumber(phoneNumber);
    const storedData = otpStore.get(cleanedNumber);
    return storedData && storedData.verified === true;
  }

  // Clear OTP after successful verification
  static clearOtp(phoneNumber) {
    const cleanedNumber = this.cleanPhoneNumber(phoneNumber);
    otpStore.delete(cleanedNumber);
  }

  // Send SMS via your API
  static async sendSmsViaApi(phoneNumber, otp) {
    // Remove +91 prefix if present for API
    let cleanNumber = phoneNumber;
    if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
      cleanNumber = cleanNumber.slice(2);
    }
    
    const apiUrl = `http://dltsms.jupitersms.com/http-tokenkeyapi.php`;
    const message = `Dear Customer, Your OTP for verification is ${otp}. Please enter this code to complete the process. TEXT2`;
    
    const params = new URLSearchParams({
      'authentic-key': '363664656d6f6a7570697465723130301747141507',
      'senderid': 'TETXTO',
      'route': '1',
      'templateid': '1607100000000313572',
      'number': cleanNumber,
      'message': message
    });

    const fullUrl = `${apiUrl}?${params.toString()}`;
    console.log(`📤 API Request URL: ${fullUrl.substring(0, 200)}...`);

    try {
      // Use fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'text/plain'
        }
      });
      
      clearTimeout(timeoutId);
      
      const result = await response.text();
      console.log(`📨 SMS API Raw Response: "${result}"`);
      
      // Check different success indicators
      const successIndicators = ['Success', 'success', 'sent', 'msg_id', 'Message Sent', '1', 'true'];
      const isSuccess = successIndicators.some(indicator => 
        result.toLowerCase().includes(indicator.toLowerCase())
      );
      
      if (isSuccess) {
        console.log(`✅ SMS sent successfully to ${phoneNumber}`);
        return { success: true };
      }
      
      console.error(`❌ SMS API returned failure: ${result}`);
      return { success: false, error: `SMS API error: ${result.substring(0, 100)}` };
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`❌ SMS API timeout after 30 seconds`);
        return { success: false, error: 'SMS API timeout' };
      }
      console.error(`❌ SMS API Error:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Clean phone number
  static cleanPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Ensure it starts with country code (default 91 for India)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }
  
  // Get OTP for debugging (development only)
  static getOtpForDebug(phoneNumber) {
    const cleanedNumber = this.cleanPhoneNumber(phoneNumber);
    const storedData = otpStore.get(cleanedNumber);
    return storedData ? storedData.otp : null;
  }
}

// Start cleanup interval
OtpModel.startCleanup();

module.exports = OtpModel;