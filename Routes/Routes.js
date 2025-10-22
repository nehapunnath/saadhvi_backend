// functions/src/Routes/Routes.js
const express = require('express');
const router = express.Router();
const AuthController = require('../Controller/AuthController');
const ProductController = require('../Controller/ProductController');
const verifyAdmin = require('../Middleware/authMiddleware');
const upload = require('../Middleware/MulterMiddleware');
const { admin } = require('../Config/firebaseAdmin');

// TEMP: Set admin claim
router.post('/set-admin', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Admin claim set for ${email} (UID: ${user.uid})`);
    res.json({ success: true, message: `Admin set for ${email}` });
  } catch (error) {
    console.error('Set Admin Error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

// AUTH
router.post('/login', AuthController.login);
router.post('/user/register', AuthController.registerUser);

// PRODUCTS
router.post('/admin/products', verifyAdmin, upload.array('images', 5), ProductController.addProduct);
router.get('/admin/products', verifyAdmin, ProductController.getProducts);
router.get('/admin/products/:id', verifyAdmin, ProductController.getProduct);
router.put('/admin/products/:id', verifyAdmin, upload.array('images', 5), ProductController.updateProduct);
router.patch('/admin/products/:id', verifyAdmin, ProductController.updateStock);
router.delete('/admin/products/:id', verifyAdmin, ProductController.deleteProduct);

router.get('/products', ProductController.getPublicProducts);
router.get('/products/:id', ProductController.getPublicProduct);

// DASHBOARD
router.get('/admin/dashboard', verifyAdmin, (req, res) => {
  res.json({ 
    success: true, 
    message: "Welcome to Admin Dashboard",
    user: req.user 
  });
});

module.exports = router;