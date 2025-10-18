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
}

module.exports = ProductController;