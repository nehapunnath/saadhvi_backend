const CarouselModel = require('../Models/GalleryModel');
const CategoryModel = require('../Models/CategoryModel');
const { admin } = require('../Config/firebaseAdmin');

class GalleryController {
  static async addSlide(req, res) {
    try {
      const slideData = req.body;
      const imageFile = req.file;

      if (!imageFile) {
        return res.status(400).json({ success: false, error: 'Image is required' });
      }

      const result = await CarouselModel.addSlide(slideData, imageFile);
      if (result.success) {
        res.json({ success: true, message: 'Slide added', slideId: result.slideId });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('Add Slide Controller Error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async getSlides(req, res) {
    try {
      const result = await CarouselModel.getSlides();
      if (result.success) {
        res.json({ success: true, slides: result.slides });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async getSlide(req, res) {
    try {
      const { id } = req.params;
      const result = await CarouselModel.getSlide(id);
      if (result.success) {
        res.json({ success: true, slide: result.slide });
      } else {
        res.status(404).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async updateSlide(req, res) {
    try {
      const { id } = req.params;
      const slideData = req.body;
      const imageFile = req.file;

      const result = await CarouselModel.updateSlide(id, slideData, imageFile);
      if (result.success) {
        res.json({ success: true, message: 'Slide updated' });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async deleteSlide(req, res) {
    try {
      const { id } = req.params;
      const result = await CarouselModel.deleteSlide(id);
      if (result.success) {
        res.json({ success: true, message: 'Slide deleted' });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async reorderSlides(req, res) {
    try {
      const { order } = req.body; 
      const result = await CarouselModel.reorderSlides(order);
      if (result.success) {
        res.json({ success: true, message: 'Order updated' });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  // functions/src/Controller/GalleryController.js

static async getMainGalleryImage(req, res) {
  try {
    const result = await CarouselModel.getMainGalleryImage();
    if (result.success) {
      res.json({ success: true, image: result.image });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

static async uploadMainGalleryImage(req, res) {
  try {
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ success: false, error: 'Image is required' });
    }

    const result = await CarouselModel.uploadMainGalleryImage(imageFile);
    if (result.success) {
      res.json({ success: true, message: 'Main gallery image uploaded', imageUrl: result.imageUrl });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Upload Main Image Controller Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

static async deleteMainGalleryImage(req, res) {
  try {
    const result = await CarouselModel.deleteMainGalleryImage();
    if (result.success) {
      res.json({ success: true, message: 'Main gallery image deleted' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
// functions/src/Controller/GalleryController.js
// Add these methods to your existing GalleryController class

static async addCollection(req, res) {
  try {
    const { name, description, items, displayOrder, isActive, categoryId } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Collection name is required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Collection image is required' });
    }
    
    // Validate category if provided
    if (categoryId) {
      const categorySnapshot = await admin.database().ref(`categories/${categoryId}`).once('value');
      if (!categorySnapshot.exists()) {
        return res.status(400).json({ success: false, error: 'Selected category does not exist' });
      }
    }
    
    const result = await CarouselModel.addCollection({
      name,
      description: description || '',
      items: items || '',
      displayOrder: displayOrder ? parseInt(displayOrder) : null,
      isActive: isActive !== undefined ? isActive : true,
      categoryId: categoryId || null
    }, req.file);
    
    if (result.success) {
      res.json({ success: true, message: 'Collection added successfully!', collectionId: result.collectionId });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Add Collection Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

static async getCollections(req, res) {
  try {
    const result = await CarouselModel.getCollections();
    if (result.success) {
      res.json({ success: true, collections: result.collections });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

static async getCollection(req, res) {
  try {
    const { id } = req.params;
    const result = await CarouselModel.getCollection(id);
    if (result.success) {
      res.json({ success: true, collection: result.collection });
    } else {
      res.status(404).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

static async updateCollection(req, res) {
  try {
    const { id } = req.params;
    const { name, description, items, displayOrder, isActive, categoryId } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Collection name is required' });
    }
    
    // Validate category if provided
    if (categoryId) {
      const categorySnapshot = await admin.database().ref(`categories/${categoryId}`).once('value');
      if (!categorySnapshot.exists()) {
        return res.status(400).json({ success: false, error: 'Selected category does not exist' });
      }
    }
    
    const result = await CarouselModel.updateCollection(id, {
      name,
      description: description || '',
      items: items || '',
      displayOrder: displayOrder ? parseInt(displayOrder) : null,
      isActive: isActive !== undefined ? isActive : true,
      categoryId: categoryId || null
    }, req.file);
    
    if (result.success) {
      res.json({ success: true, message: 'Collection updated successfully!' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Update Collection Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

static async deleteCollection(req, res) {
  try {
    const { id } = req.params;
    const result = await CarouselModel.deleteCollection(id);
    if (result.success) {
      res.json({ success: true, message: 'Collection deleted' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

static async reorderCollections(req, res) {
  try {
    const { order } = req.body;
    const result = await CarouselModel.reorderCollections(order);
    if (result.success) {
      res.json({ success: true, message: 'Order updated' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
}


// functions/src/Controller/GalleryController.js

static async getPublicCollections(req, res) {
  try {
    const result = await CarouselModel.getCollections(true);
    if (result.success) {
      const collectionsWithCategoryNames = await Promise.all(
        result.collections.map(async (collection) => {
          if (collection.categoryId && collection.categoryId !== 'undefined') {
            const categoryResult = await CategoryModel.getCategory(collection.categoryId);
            if (categoryResult.success) {
              return {
                ...collection,
                categoryName: categoryResult.category.name,
                categoryId: collection.categoryId // Make sure categoryId is preserved
              };
            }
          }
          return {
            ...collection,
            categoryName: null,
            categoryId: null
          };
        })
      );
      
      res.json({ 
        success: true, 
        collections: collectionsWithCategoryNames
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Get Public Collections Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
}

module.exports = GalleryController;