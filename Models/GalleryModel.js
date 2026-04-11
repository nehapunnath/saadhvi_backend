// functions/src/Models/GalleryModel.js
const { admin, storage } = require('../Config/firebaseAdmin');

class GalleryModel {
  // Helper method to upload images
  static async uploadImage(file, folder) {
    try {
      const bucket = storage.bucket();
      const fileName = `${folder}/${Date.now()}_${file.originalname}`;
      const fileUpload = bucket.file(fileName);

      const stream = fileUpload.createWriteStream({
        metadata: { contentType: file.mimetype }
      });

      stream.end(file.buffer);

      return new Promise((resolve, reject) => {
        stream.on('finish', async () => {
          try {
            const [url] = await fileUpload.getSignedUrl({
              action: 'read',
              expires: '03-09-2491'
            });
            resolve(url);
          } catch (err) {
            reject(err);
          }
        });
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('Upload Image Error:', error);
      throw error;
    }
  }

  // Helper method to delete images
  static async deleteImage(imageUrl) {
    try {
      if (!imageUrl) return;
      
      // Extract file path from URL
      const filePath = imageUrl.split('/o/')[1].split('?')[0];
      await storage.bucket().file(decodeURIComponent(filePath)).delete();
      console.log('Image deleted:', filePath);
    } catch (err) {
      console.warn('Failed to delete image:', err.message);
      // Don't throw error - continue with operation even if image deletion fails
    }
  }

  static async addSlide(slideData, imageFile) {
    try {
      let imageUrl = '';

      // Upload image if provided
      if (imageFile) {
        imageUrl = await this.uploadImage(imageFile, 'carousel');
      }

      const slideId = admin.database().ref('carousel').push().key;
      const slide = {
        id: slideId,
        title: slideData.title,
        subtitle: slideData.subtitle,
        cta: slideData.cta || 'Shop Now',
        image: imageUrl,
        order: parseInt(slideData.order) || 0,
        createdAt: admin.database.ServerValue.TIMESTAMP,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      };

      await admin.database().ref(`carousel/${slideId}`).set(slide);
      console.log('Carousel slide added:', slideId);
      return { success: true, slideId, slide };
    } catch (error) {
      console.error('Add Carousel Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getSlides() {
    try {
      const snapshot = await admin.database().ref('carousel').once('value');
      const slides = [];
      snapshot.forEach(child => {
        slides.push({ ...child.val(), key: child.key });
      });
      // Sort by order
      slides.sort((a, b) => a.order - b.order);
      return { success: true, slides };
    } catch (error) {
      console.error('Get Carousel Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getSlide(id) {
    try {
      const snapshot = await admin.database().ref(`carousel/${id}`).once('value');
      if (!snapshot.exists()) {
        return { success: false, error: 'Slide not found' };
      }
      const slide = snapshot.val();
      slide.key = id;
      return { success: true, slide };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async updateSlide(id, slideData, imageFile = null) {
    try {
      const snapshot = await admin.database().ref(`carousel/${id}`).once('value');
      if (!snapshot.exists()) {
        return { success: false, error: 'Slide not found' };
      }

      const existing = snapshot.val();
      let imageUrl = existing.image;

      if (imageFile) {
        // Delete old image if it exists
        if (imageUrl) {
          await this.deleteImage(imageUrl);
        }
        imageUrl = await this.uploadImage(imageFile, 'carousel');
      }

      const updates = {
        title: slideData.title,
        subtitle: slideData.subtitle,
        cta: slideData.cta || 'Shop Now',
        image: imageUrl,
        order: parseInt(slideData.order) || existing.order,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      };

      await admin.database().ref(`carousel/${id}`).update(updates);
      console.log('Carousel slide updated:', id);
      return { success: true, slideId: id };
    } catch (error) {
      console.error('Update Carousel Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteSlide(id) {
    try {
      const snapshot = await admin.database().ref(`carousel/${id}`).once('value');
      if (!snapshot.exists()) {
        return { success: false, error: 'Slide not found' };
      }

      const slide = snapshot.val();
      if (slide.image) {
        await this.deleteImage(slide.image);
      }

      await admin.database().ref(`carousel/${id}`).remove();
      console.log('Carousel slide deleted:', id);
      return { success: true };
    } catch (error) {
      console.error('Delete Carousel Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async reorderSlides(orderMap) {
    // orderMap: { slideId: newOrder }
    try {
      const batch = {};
      for (const [id, order] of Object.entries(orderMap)) {
        batch[`carousel/${id}/order`] = parseInt(order);
        batch[`carousel/${id}/updatedAt`] = admin.database.ServerValue.TIMESTAMP;
      }
      await admin.database().ref().update(batch);
      return { success: true };
    } catch (error) {
      console.error('Reorder Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getMainGalleryImage() {
    try {
      const snapshot = await admin.database().ref('mainGalleryImage').once('value');
      if (!snapshot.exists()) {
        return { success: true, image: null };
      }
      const data = snapshot.val();
      return { success: true, image: data.imageUrl };
    } catch (error) {
      console.error('Get Main Gallery Image Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async uploadMainGalleryImage(imageFile) {
    try {
      const imageUrl = await this.uploadImage(imageFile, 'main-gallery');

      const mainImageData = {
        imageUrl: imageUrl,
        uploadedAt: admin.database.ServerValue.TIMESTAMP,
        fileName: `main-gallery/${Date.now()}_${imageFile.originalname}`
      };

      await admin.database().ref('mainGalleryImage').set(mainImageData);
      console.log('Main gallery image uploaded');
      return { success: true, imageUrl };
    } catch (error) {
      console.error('Upload Main Gallery Image Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteMainGalleryImage() {
    try {
      const snapshot = await admin.database().ref('mainGalleryImage').once('value');
      if (!snapshot.exists()) {
        return { success: false, error: 'Main gallery image not found' };
      }

      const mainImageData = snapshot.val();
      
      if (mainImageData.imageUrl) {
        await this.deleteImage(mainImageData.imageUrl);
      }

      await admin.database().ref('mainGalleryImage').remove();
      console.log('Main gallery image deleted');
      return { success: true };
    } catch (error) {
      console.error('Delete Main Gallery Image Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async addCollection(collectionData, file) {
    try {
      // Upload image to Firebase Storage using helper method
      const imageUrl = await this.uploadImage(file, 'collections');
      
      const collectionId = admin.database().ref('collections').push().key;
      const collection = {
        id: collectionId,
        name: collectionData.name,
        description: collectionData.description || '',
        items: collectionData.items || '',
        image: imageUrl,
        displayOrder: collectionData.displayOrder || null,
        isActive: collectionData.isActive !== undefined ? collectionData.isActive : true,
        categoryId: collectionData.categoryId || null,
        createdAt: admin.database.ServerValue.TIMESTAMP,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      };

      await admin.database().ref(`collections/${collectionId}`).set(collection);
      console.log('Collection added:', collectionId);
      return { success: true, collectionId, collection };
    } catch (error) {
      console.error('Add Collection Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getCollections(publicOnly = false) {
    try {
      const snapshot = await admin.database().ref('collections').once('value');
      let collections = [];
      
      snapshot.forEach(child => {
        const collection = { id: child.key, ...child.val() };
        if (publicOnly && collection.isActive === false) {
          return; // Skip inactive collections for public
        }
        collections.push(collection);
      });
      
      // Sort by displayOrder
      collections.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      
      return { success: true, collections };
    } catch (error) {
      console.error('Get Collections Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getCollection(id) {
    try {
      const snapshot = await admin.database().ref(`collections/${id}`).once('value');
      if (!snapshot.exists()) {
        return { success: false, error: 'Collection not found' };
      }
      const collection = snapshot.val();
      collection.id = id;
      return { success: true, collection };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async updateCollection(id, collectionData, file) {
    try {
      const snapshot = await admin.database().ref(`collections/${id}`).once('value');
      if (!snapshot.exists()) {
        return { success: false, error: 'Collection not found' };
      }

      let imageUrl = snapshot.val().image;
      if (file) {
        // Delete old image if it exists
        if (imageUrl) {
          await this.deleteImage(imageUrl);
        }
        imageUrl = await this.uploadImage(file, 'collections');
      }

      const updates = {
        name: collectionData.name,
        description: collectionData.description || '',
        items: collectionData.items || '',
        image: imageUrl,
        displayOrder: collectionData.displayOrder || null,
        isActive: collectionData.isActive !== undefined ? collectionData.isActive : true,
        categoryId: collectionData.categoryId || null,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      };

      await admin.database().ref(`collections/${id}`).update(updates);
      console.log('Collection updated:', id);
      return { success: true };
    } catch (error) {
      console.error('Update Collection Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteCollection(id) {
    try {
      const snapshot = await admin.database().ref(`collections/${id}`).once('value');
      if (!snapshot.exists()) {
        return { success: false, error: 'Collection not found' };
      }

      const collection = snapshot.val();
      if (collection.image) {
        await this.deleteImage(collection.image);
      }

      await admin.database().ref(`collections/${id}`).remove();
      console.log('Collection deleted:', id);
      return { success: true };
    } catch (error) {
      console.error('Delete Collection Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async reorderCollections(orderMap) {
    // orderMap: { collectionId: newOrder }
    try {
      const batch = {};
      for (const [id, order] of Object.entries(orderMap)) {
        batch[`collections/${id}/displayOrder`] = parseInt(order);
        batch[`collections/${id}/updatedAt`] = admin.database.ServerValue.TIMESTAMP;
      }
      await admin.database().ref().update(batch);
      return { success: true };
    } catch (error) {
      console.error('Reorder Collections Error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = GalleryModel;