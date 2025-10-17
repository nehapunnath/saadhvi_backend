// functions/src/Middleware/authMiddleware.js
const AuthModel = require('../Models/AuthModel');

const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const result = await AuthModel.verifyToken(token);
    
    if (!result.success) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const isAdmin = await AuthModel.isAdmin(result.decodedToken.uid);
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    req.user = result.decodedToken;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: 'Auth error' });
  }
};

module.exports = verifyAdmin;