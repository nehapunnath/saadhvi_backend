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
}

module.exports = ProductController;