// functions/src/Controller/CategoryController.js
const CategoryModel = require('../Models/CategoryModel');

class CategoryController {
  static async getCategories(req, res) {
    try {
      const result = await CategoryModel.getAllCategories();
      if (result.success) {
        res.json({ success: true, categories: result.categories });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async addCategory(req, res) {
    try {
      const categoryData = req.body;
      const result = await CategoryModel.addCategory(categoryData);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Category added successfully!',
          categoryId: result.categoryId 
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const categoryData = req.body;
      const result = await CategoryModel.updateCategory(id, categoryData);
      
      if (result.success) {
        res.json({ success: true, message: 'Category updated successfully!' });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const { excludeProductId } = req.body; // Get excludeProductId from request body
      
      const result = await CategoryModel.deleteCategory(id, excludeProductId);
      
      if (result.success) {
        res.json({ success: true, message: 'Category deleted successfully!' });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async getCategory(req, res) {
    try {
      const { id } = req.params;
      const result = await CategoryModel.getCategory(id);
      if (result.success) {
        res.json({ success: true, category: result.category });
      } else {
        res.status(404).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
}

module.exports = CategoryController;