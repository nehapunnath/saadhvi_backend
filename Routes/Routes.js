const express = require('express');
const router = express.Router();
const AuthController = require('../Controller/AuthController');
const ProductController = require('../Controller/ProductController');
const { verifyAdmin, verifyUser } = require('../Middleware/authMiddleware');
const upload = require('../Middleware/MulterMiddleware');
const { admin } = require('../Config/firebaseAdmin');
const OrderController = require('../Controller/OrderController');
const CarouselController = require('../Controller/GalleryController');
const CategoryController = require('../Controller/CategoryController');

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

router.post('/login', AuthController.login);
router.post('/user/register', AuthController.registerUser);

router.post('/admin/products', verifyAdmin, upload.array('images', 5), ProductController.addProduct);
router.get('/admin/products', verifyAdmin, ProductController.getProducts);
router.get('/admin/products/:id', verifyAdmin, ProductController.getProduct);
router.put('/admin/products/:id', verifyAdmin, upload.array('images', 5), ProductController.updateProduct);
router.patch('/admin/products/:id', verifyAdmin, ProductController.updateStock);
router.patch('/admin/products/:id/offer', verifyAdmin, ProductController.updateOffer);
router.delete('/admin/products/:id', verifyAdmin, ProductController.deleteProduct);

router.get('/admin/categories', verifyAdmin, CategoryController.getCategories);
router.post('/admin/categories', verifyAdmin, CategoryController.addCategory);
router.put('/admin/categories/:id', verifyAdmin, CategoryController.updateCategory);
router.delete('/admin/categories/:id', verifyAdmin, CategoryController.deleteCategory);
router.get('/admin/categories/:id', verifyAdmin, CategoryController.getCategory);

router.get('/categories', CategoryController.getCategories);

router.get('/products', ProductController.getPublicProducts);
router.get('/products/:id', ProductController.getPublicProduct);

router.get('/products/search', ProductController.searchProducts);


router.get('/wishlist', verifyUser, ProductController.getWishlist); 
router.post('/wishlist', verifyUser, ProductController.addToWishlist); 
router.delete('/wishlist/:id', verifyUser, ProductController.removeFromWishlist); 

router.get('/cart', verifyUser, ProductController.getCart);
router.post('/cart', verifyUser, ProductController.addToCart);
router.put('/cart/:id', verifyUser, ProductController.updateCartItem);
router.delete('/cart/:id', verifyUser, ProductController.removeFromCart);

router.post('/checkout', verifyUser, OrderController.checkout);
router.get('/admin/orders/:orderId', verifyAdmin, OrderController.getOrderById);
router.get('/admin/orders', verifyAdmin, OrderController.getAllOrders);
router.put('/admin/orders/:orderId', verifyAdmin, OrderController.updateOrder);
router.delete('/admin/orders/:orderId', verifyAdmin, OrderController.deleteOrder);

router.post('/admin/carousel', verifyAdmin, upload.single('image'), CarouselController.addSlide);
router.get('/admin/carousel', verifyAdmin, CarouselController.getSlides);
router.get('/admin/carousel/:id', verifyAdmin, CarouselController.getSlide);
router.put('/admin/carousel/:id', verifyAdmin, upload.single('image'), CarouselController.updateSlide);
router.delete('/admin/carousel/:id', verifyAdmin, CarouselController.deleteSlide);
router.patch('/admin/carousel/reorder', verifyAdmin, CarouselController.reorderSlides);

router.get('/carousel', CarouselController.getSlides); 

router.get('/admin/main-gallery-image', verifyAdmin, CarouselController.getMainGalleryImage);
router.post('/admin/main-gallery-image', verifyAdmin, upload.single('image'), CarouselController.uploadMainGalleryImage);
router.delete('/admin/main-gallery-image', verifyAdmin, CarouselController.deleteMainGalleryImage);
router.get('/main-gallery-image', CarouselController.getMainGalleryImage);



router.get('/admin/dashboard', verifyAdmin, (req, res) => {
  res.json({ 
    success: true, 
    message: "Welcome to Admin Dashboard",
    user: req.user 
  });
});

module.exports = router;