// functions/src/Models/ProductModel.js
const { admin, storage } = require('../Config/firebaseAdmin');

class ProductModel {
  static async addProduct(productData, imageFiles) {
    try {
    // 🔥 UPLOAD MULTIPLE IMAGES - ADMIN SDK
let imageUrls = [];
if (imageFiles && imageFiles.length > 0) {
  console.log(`🔄 Starting upload: ${imageFiles.length} images`);
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    console.log(`🔄 Uploading image ${i + 1}:`, file.originalname);
    
    const bucket = storage.bucket();
    const fileName = `products/${Date.now()}_${i}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);
    
    const stream = fileUpload.createWriteStream({
      metadata: { contentType: file.mimetype }
    });
    
    stream.end(file.buffer);
    
    await new Promise((resolve, reject) => {
      stream.on('finish', async () => {
        try {
          const [url] = await fileUpload.getSignedUrl({
            action: 'read',
            expires: '03-09-2491'
          });
          imageUrls.push(url);
          console.log(`✅ Image ${i + 1} uploaded:`, url);
          resolve();
        } catch (error) {
          console.error(`💥 Image ${i + 1} error:`, error);
          reject(error);
        }
      });
      stream.on('error', reject);
    });
  }
  console.log('✅ UPLOAD COMPLETE:', imageUrls.length, 'images'); // 🔥 DEBUG
} else {
  console.log('⚠️ NO IMAGES UPLOADED'); // 🔥 DEBUG
}
      // 🔥 SAVE TO REALTIME DATABASE
      const productId = admin.database().ref('products').push().key;
      const product = {
        id: productId,
        ...productData,
        images: imageUrls,
        createdAt: admin.database.ServerValue.TIMESTAMP,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      };

      await admin.database().ref(`products/${productId}`).set(product);
      console.log('✅ Product added:', productId);
      
      return { success: true, productId, product };
    } catch (error) {
      console.error('💥 Add Product Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getProducts() {
    try {
      const snapshot = await admin.database().ref('products').once('value');
      const products = [];
      snapshot.forEach(child => {
        products.push({ ...child.val(), key: child.key });
      });
      console.log('✅ Fetched', products.length, 'products');
      return { success: true, products };
    } catch (error) {
      console.error('💥 Get Products Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getProduct(id) {
    try {
      const snapshot = await admin.database().ref(`products/${id}`).once('value');
      if (!snapshot.exists()) {
        return { success: false, error: 'Product not found' };
      }
      const product = snapshot.val();
      product.key = id;
      return { success: true, product };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async updateProduct(id, productData, imageFiles = []) {
    try {
      let imageUrls = productData.images || [];

      // 🔥 ADD NEW IMAGES
      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const bucket = storage.bucket();
          const fileName = `products/${Date.now()}_${i}_${file.originalname}`;
          const fileUpload = bucket.file(fileName);
          
          const stream = fileUpload.createWriteStream({
            metadata: { contentType: file.mimetype }
          });
          
          stream.end(file.buffer);
          
          await new Promise((resolve, reject) => {
            stream.on('finish', async () => {
              try {
                const [url] = await fileUpload.getSignedUrl({
                  action: 'read',
                  expires: '03-09-2491'
                });
                imageUrls.push(url);
                resolve();
              } catch (error) {
                reject(error);
              }
            });
            stream.on('error', reject);
          });
        }
      }

      const updates = {
        ...productData,
        images: imageUrls,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      };

      await admin.database().ref(`products/${id}`).update(updates);
      console.log('✅ Product updated:', id);
      
      return { success: true, productId: id };
    } catch (error) {
      console.error('💥 Update Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteProduct(id) {
    try {
      await admin.database().ref(`products/${id}`).remove();
      console.log('✅ Product deleted:', id);
      return { success: true };
    } catch (error) {
      console.error('💥 Delete Error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ProductModel;