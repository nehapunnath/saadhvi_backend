// functions/src/Models/CategoryModel.js
const { admin } = require('../Config/firebaseAdmin');

class CategoryModel {
  static async getAllCategories() {
    try {
      const snapshot = await admin.database().ref('categories').once('value');
      const categories = [];
      snapshot.forEach(child => {
        categories.push({ 
          id: child.key, 
          ...child.val() 
        });
      });
      
      // Sort by order if available, otherwise by name
      categories.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
      
      return { success: true, categories };
    } catch (error) {
      console.error('Get Categories Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async addCategory(categoryData) {
    try {
      const categoryId = admin.database().ref('categories').push().key;
      const category = {
        id: categoryId,
        name: categoryData.name,
        order: categoryData.order || 0,
        isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
        createdAt: admin.database.ServerValue.TIMESTAMP,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      };

      await admin.database().ref(`categories/${categoryId}`).set(category);
      console.log('Category added:', categoryId);
      return { success: true, categoryId, category };
    } catch (error) {
      console.error('Add Category Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateCategory(id, categoryData) {
    try {
      const snapshot = await admin.database().ref(`categories/${id}`).once('value');
      if (!snapshot.exists()) {
        return { success: false, error: 'Category not found' };
      }

      const updates = {
        name: categoryData.name,
        order: categoryData.order || 0,
        isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      };

      await admin.database().ref(`categories/${id}`).update(updates);
      console.log('Category updated:', id);
      return { success: true, categoryId: id };
    } catch (error) {
      console.error('Update Category Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteCategory(id, excludeProductId = null) {
    try {
      // Check if category is used in any products (excluding the current product if provided)
      const productsSnapshot = await admin.database().ref('products').once('value');
      let isUsed = false;
      
      productsSnapshot.forEach(child => {
        const product = child.val();
        // Skip the excluded product (current product being edited)
        if (excludeProductId && child.key === excludeProductId) {
          return;
        }
        if (product.category === id) {
          isUsed = true;
        }
      });
      
      if (isUsed) {
        return { 
          success: false, 
          error: 'Cannot delete category. It is being used by other products.' 
        };
      }

      await admin.database().ref(`categories/${id}`).remove();
      console.log('Category deleted:', id);
      return { success: true };
    } catch (error) {
      console.error('Delete Category Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getCategory(id) {
    try {
      const snapshot = await admin.database().ref(`categories/${id}`).once('value');
      if (!snapshot.exists()) {
        return { success: false, error: 'Category not found' };
      }
      const category = { id, ...snapshot.val() };
      return { success: true, category };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = CategoryModel;