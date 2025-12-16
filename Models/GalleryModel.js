// functions/src/Models/CarouselModel.js
const { admin, storage } = require('../Config/firebaseAdmin');

class GalleryModel {
  static async addSlide(slideData, imageFile) {
    try {
      let imageUrl = '';

      // Upload image if provided
      if (imageFile) {
        const bucket = storage.bucket();
        const fileName = `carousel/${Date.now()}_${imageFile.originalname}`;
        const fileUpload = bucket.file(fileName);

        const stream = fileUpload.createWriteStream({
          metadata: { contentType: imageFile.mimetype }
        });

        stream.end(imageFile.buffer);

        await new Promise((resolve, reject) => {
          stream.on('finish', async () => {
            try {
              const [url] = await fileUpload.getSignedUrl({
                action: 'read',
                expires: '03-09-2491'
              });
              imageUrl = url;
              resolve();
            } catch (err) {
              reject(err);
            }
          });
          stream.on('error', reject);
        });
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
        const bucket = storage.bucket();
        const fileName = `carousel/${Date.now()}_${imageFile.originalname}`;
        const fileUpload = bucket.file(fileName);

        const stream = fileUpload.createWriteStream({
          metadata: { contentType: imageFile.mimetype }
        });

        stream.end(imageFile.buffer);

        await new Promise((resolve, reject) => {
          stream.on('finish', async () => {
            try {
              const [url] = await fileUpload.getSignedUrl({
                action: 'read',
                expires: '03-09-2491'
              });
              imageUrl = url;
              resolve();
            } catch (err) {
              reject(err);
            }
          });
          stream.on('error', reject);
        });
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
        try {
          const filePath = slide.image.split('/o/')[1].split('?')[0];
          await storage.bucket().file(decodeURIComponent(filePath)).delete();
        } catch (err) {
          console.warn('Failed to delete image:', err.message);
        }
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
    let imageUrl = '';

    const bucket = storage.bucket();
    const fileName = `main-gallery/${Date.now()}_${imageFile.originalname}`;
    const fileUpload = bucket.file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: { contentType: imageFile.mimetype }
    });

    stream.end(imageFile.buffer);

    await new Promise((resolve, reject) => {
      stream.on('finish', async () => {
        try {
          const [url] = await fileUpload.getSignedUrl({
            action: 'read',
            expires: '03-09-2491'
          });
          imageUrl = url;
          resolve();
        } catch (err) {
          reject(err);
        }
      });
      stream.on('error', reject);
    });

    const mainImageData = {
      imageUrl: imageUrl,
      uploadedAt: admin.database.ServerValue.TIMESTAMP,
      fileName: fileName
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
      try {
        const filePath = mainImageData.imageUrl.split('/o/')[1].split('?')[0];
        await storage.bucket().file(decodeURIComponent(filePath)).delete();
      } catch (err) {
        console.warn('Failed to delete main image from storage:', err.message);
      }
    }

    await admin.database().ref('mainGalleryImage').remove();
    console.log('Main gallery image deleted');
    return { success: true };
  } catch (error) {
    console.error('Delete Main Gallery Image Error:', error);
    return { success: false, error: error.message };
  }
}
static async addCollection(collectionData, imageFile) {
  try {
    let imageUrl = '';

    // Upload image if provided
    if (imageFile) {
      const bucket = storage.bucket();
      const fileName = `collections/${Date.now()}_${imageFile.originalname}`;
      const fileUpload = bucket.file(fileName);

      const stream = fileUpload.createWriteStream({
        metadata: { contentType: imageFile.mimetype }
      });

      stream.end(imageFile.buffer);

      await new Promise((resolve, reject) => {
        stream.on('finish', async () => {
          try {
            const [url] = await fileUpload.getSignedUrl({
              action: 'read',
              expires: '03-09-2491'
            });
            imageUrl = url;
            resolve();
          } catch (err) {
            reject(err);
          }
        });
        stream.on('error', reject);
      });
    }

    const collectionId = admin.database().ref('collections').push().key;
    const collection = {
      id: collectionId,
      name: collectionData.name,
      description: collectionData.description || '',
      items: collectionData.items || '',
      image: imageUrl,
      displayOrder: parseInt(collectionData.displayOrder) || 0,
      isActive: collectionData.isActive !== false,
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

static async getCollections() {
  try {
    const snapshot = await admin.database().ref('collections').once('value');
    const collections = [];
    snapshot.forEach(child => {
      collections.push({ ...child.val(), key: child.key });
    });
    // Sort by displayOrder
    collections.sort((a, b) => a.displayOrder - b.displayOrder);
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
    collection.key = id;
    return { success: true, collection };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

static async updateCollection(id, collectionData, imageFile = null) {
  try {
    const snapshot = await admin.database().ref(`collections/${id}`).once('value');
    if (!snapshot.exists()) {
      return { success: false, error: 'Collection not found' };
    }

    const existing = snapshot.val();
    let imageUrl = existing.image;

    if (imageFile) {
      const bucket = storage.bucket();
      const fileName = `collections/${Date.now()}_${imageFile.originalname}`;
      const fileUpload = bucket.file(fileName);

      const stream = fileUpload.createWriteStream({
        metadata: { contentType: imageFile.mimetype }
      });

      stream.end(imageFile.buffer);

      await new Promise((resolve, reject) => {
        stream.on('finish', async () => {
          try {
            const [url] = await fileUpload.getSignedUrl({
              action: 'read',
              expires: '03-09-2491'
            });
            imageUrl = url;
            resolve();
          } catch (err) {
            reject(err);
          }
        });
        stream.on('error', reject);
      });
    }

    const updates = {
      name: collectionData.name,
      description: collectionData.description || existing.description,
      items: collectionData.items || existing.items,
      image: imageUrl,
      displayOrder: parseInt(collectionData.displayOrder) || existing.displayOrder,
      isActive: collectionData.isActive !== false,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    };

    await admin.database().ref(`collections/${id}`).update(updates);
    console.log('Collection updated:', id);
    return { success: true, collectionId: id };
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
      try {
        const filePath = collection.image.split('/o/')[1].split('?')[0];
        await storage.bucket().file(decodeURIComponent(filePath)).delete();
      } catch (err) {
        console.warn('Failed to delete collection image:', err.message);
      }
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