const ProductModel = require('../Models/ProductModel');
const { admin } = require('../Config/firebaseAdmin');


class ProductController {
  static async addProduct(req, res) {
    try {
      let productData = req.body;
      const imageFiles = req.files; 

      
      if (productData.occasion) {
        productData.occasion = JSON.parse(productData.occasion);
      }

      console.log(' ADD PRODUCT -', imageFiles?.length || 0, 'images');

      const result = await ProductModel.addProduct(productData, imageFiles);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Product added successfully!',
          productId: result.productId 
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error(' Controller Error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async getProducts(req, res) {
    try {
      const result = await ProductModel.getProducts();
      if (result.success) {
        res.json({ success: true, products: result.products });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async getProduct(req, res) {
    try {
      const { id } = req.params;
      const result = await ProductModel.getProduct(id);
      if (result.success) {
        res.json({ success: true, product: result.product });
      } else {
        res.status(404).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      let productData = req.body;
      const imageFiles = req.files;

      if (productData.occasion) {
        productData.occasion = JSON.parse(productData.occasion);
      }

      const result = await ProductModel.updateProduct(id, productData, imageFiles);
      
      if (result.success) {
        res.json({ success: true, message: 'Product updated successfully!' });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const result = await ProductModel.deleteProduct(id);
      
      if (result.success) {
        res.json({ success: true, message: 'Product deleted successfully!' });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
static async updateStock(req, res) {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    
    const stockValue = parseInt(stock);
    
    await admin.database().ref(`products/${id}`).update({
      stock: stockValue,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    });
    
    console.log(' Stock updated for:', id, 'to:', stockValue);
    res.json({ success: true, message: 'Stock updated!' });
  } catch (error) {
    console.error(' Stock Update Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
// Add these methods to your existing ProductController class

static async getPublicProducts(req, res) {
  try {
    const result = await ProductModel.getProducts();
    if (result.success) {
      // Return only necessary fields for public viewing
      const publicProducts = result.products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        badge: product.badge,
        material: product.material,
        length: product.length,
        weave: product.weave,
        care: product.care,
        weight: product.weight,
        border: product.border,
        origin: product.origin,
        sizeGuide: product.sizeGuide,
        extraCharges: product.extraCharges,
        occasion: product.occasion,
        images: product.images,
        createdAt: product.createdAt
      }));
      
      res.json({ success: true, products: publicProducts });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Public Get Products Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

static async getPublicProduct(req, res) {
  try {
    const { id } = req.params;
    const result = await ProductModel.getProduct(id);
    if (result.success) {
      // Return only necessary fields for public viewing
      const publicProduct = {
        id: result.product.id,
        name: result.product.name,
        description: result.product.description,
        category: result.product.category,
        price: result.product.price,
        originalPrice: result.product.originalPrice,
        stock: result.product.stock,
        badge: result.product.badge,
        material: result.product.material,
        length: result.product.length,
        weave: result.product.weave,
        care: result.product.care,
        weight: result.product.weight,
        border: result.product.border,
        origin: result.product.origin,
        sizeGuide: result.product.sizeGuide,
        extraCharges: result.product.extraCharges,
        occasion: result.product.occasion,
        images: result.product.images,
        createdAt: result.product.createdAt
      };
      
      res.json({ success: true, product: publicProduct });
    } else {
      res.status(404).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Public Get Product Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
static async getWishlist(req, res) {
    try {
      const userId = req.user.uid; // From verifyToken middleware
      const snapshot = await admin.database().ref(`wishlist/${userId}`).once('value');
      const items = [];
      snapshot.forEach(child => {
        items.push({ id: child.key, ...child.val() });
      });
      res.json({ success: true, items });
    } catch (error) {
      console.error(' Get Wishlist Error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async addToWishlist(req, res) {
    try {
      const userId = req.user.uid;
      const item = req.body;
      await admin.database().ref(`wishlist/${userId}/${item.id}`).set({
        name: item.name,
        price: item.price,
        image: item.image,
        addedAt: admin.database.ServerValue.TIMESTAMP
      });
      res.json({ success: true, message: 'Added to wishlist' });
    } catch (error) {
      console.error(' Add Wishlist Error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async removeFromWishlist(req, res) {
    try {
      const userId = req.user.uid;
      const { id } = req.params;
      await admin.database().ref(`wishlist/${userId}/${id}`).remove();
      res.json({ success: true, message: 'Removed from wishlist' });
    } catch (error) {
      console.error(' Remove Wishlist Error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
  static async getCart(req, res) {
  try {
    const userId = req.user.uid; // From verifyToken middleware
    const snapshot = await admin.database().ref(`cart/${userId}`).once('value');
    const items = [];
    snapshot.forEach(child => {
      items.push({ id: child.key, ...child.val() });
    });
    res.json({ success: true, items });
  } catch (error) {
    console.error('Get Cart Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

static async addToCart(req, res) {
  try {
    const userId = req.user.uid;
    const { id, name, price, image, quantity = 1 } = req.body;

    // Validate input
    if (!id || !name || !price || !image) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const qty = parseInt(quantity);
    if (qty < 1) {
      return res.status(400).json({ success: false, error: 'Quantity must be at least 1' });
    }

    // Check product exists and has enough stock
    const productSnapshot = await admin.database().ref(`products/${id}`).once('value');
    const product = productSnapshot.val();
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        error: `Only ${product.stock} item(s) in stock`,
      });
    }

    // Always set (replace) the quantity in cart
    const cartRef = admin.database().ref(`cart/${userId}/${id}`);
    await cartRef.set({
      name,
      price,
      image,
      quantity: qty,
      addedAt: admin.database.ServerValue.TIMESTAMP,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    });

    res.json({ success: true, message: 'Added to cart' });
  } catch (error) {
    console.error('Add to Cart Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}


static async updateCartItem(req, res) {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const { quantity } = req.body;

    // Validate input
    if (!quantity || quantity < 1) {
      console.error(`Invalid quantity received: ${quantity}`);
      return res.status(400).json({ success: false, error: 'Invalid quantity' });
    }

    // Fetch product stock
    const productSnapshot = await admin.database().ref(`products/${id}`).once('value');
    const product = productSnapshot.val();
    if (!product) {
      console.error(`Product not found: ${id}`);
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    console.log(`Product ${id} stock: ${product.stock}, requested quantity: ${quantity}`);
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
      });
    }

    // Check if item exists in cart
    const cartRef = admin.database().ref(`cart/${userId}/${id}`);
    const cartSnapshot = await cartRef.once('value');
    if (!cartSnapshot.exists()) {
      console.error(`Item not in cart: ${id} for user: ${userId}`);
      return res.status(404).json({ success: false, error: 'Item not in cart' });
    }

    await cartRef.update({
      quantity,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    });

    console.log(`Cart updated for user: ${userId}, product: ${id}, new quantity: ${quantity}`);
    res.json({ success: true, message: 'Cart updated', quantity });
  } catch (error) {
    console.error('Update Cart Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

static async removeFromCart(req, res) {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    // Check if item exists in cart
    const cartRef = admin.database().ref(`cart/${userId}/${id}`);
    const cartSnapshot = await cartRef.once('value');
    if (!cartSnapshot.exists()) {
      return res.status(404).json({ success: false, error: 'Item not in cart' });
    }

    await cartRef.remove();
    res.json({ success: true, message: 'Removed from cart' });
  } catch (error) {
    console.error('Remove from Cart Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

static async searchProducts(req, res) {
  try {
    const { q } = req.query;

    // Validate search query
    if (!q || q.trim().length < 2) {
      return res.json({ 
        success: true, 
        results: [],
        message: 'Search query too short' 
      });
    }

    const searchTerm = q.trim().toLowerCase();
    console.log(`🔍 Searching for: "${searchTerm}"`);

    const snapshot = await admin.database().ref('products').once('value');
    const products = snapshot.val() || {};

    console.log(`📦 Total products in DB: ${Object.keys(products).length}`);

    const results = Object.entries(products)
      .map(([id, product]) => {
        if (!product) return null;
        
        return {
          id,
          name: product.name || '',
          image: (product.images && product.images[0]) || '/placeholder.jpg',
          price: product.price || 0,
          category: product.category || '',
          description: product.description || '',
        };
      })
      .filter(Boolean)
      .filter(p => {
        // More comprehensive search matching
        const searchableText = `
          ${p.name || ''} 
          ${p.category || ''} 
          ${p.description || ''}
        `.toLowerCase();
        
        return searchableText.includes(searchTerm);
      })
      .slice(0, 8) // Reduced from 10 to 8 for better UI
      .map(p => ({
        id: p.id,
        name: p.name,
        image: p.image,
        price: p.price,
        category: p.category,
      }));

    console.log(`✅ Found ${results.length} results for "${searchTerm}"`);
    
    res.json({ 
      success: true, 
      results,
      count: results.length 
    });
    
  } catch (error) {
    console.error('❌ Search Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Search failed',
      message: error.message 
    });
  }
}
 
}

module.exports = ProductController;