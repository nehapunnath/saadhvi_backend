// functions/src/Models/ProductModel.js
const { admin, storage } = require('../Config/firebaseAdmin');

class ProductModel {
static async addProduct(productData, imageFiles) {
  try {
    let imageUrls = [];
    
    if (imageFiles && imageFiles.length > 0) {
      console.log(` Starting upload: ${imageFiles.length} images`);
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        console.log(` Uploading image ${i + 1}:`, file.originalname);
        
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
              console.log(` Image ${i + 1} uploaded:`, url);
              resolve();
            } catch (error) {
              console.error(` Image ${i + 1} error:`, error);
              reject(error);
            }
          });
          stream.on('error', reject);
        });
      }
      console.log(' UPLOAD COMPLETE:', imageUrls.length, 'images');
    } else {
      console.log(' NO IMAGES UPLOADED');
    }

    const productId = admin.database().ref('products').push().key;
    const product = {
      id: productId,
      name: productData.name,
      description: productData.description,
      category: productData.category,
      price: parseInt(productData.price) || 0,
      originalPrice: parseInt(productData.originalPrice) || 0,
      stock: parseInt(productData.stock) || 0, 
      badge: productData.badge || '',
      material: productData.material || '',
      length: productData.length || '',
      weave: productData.weave || '',
      care: productData.care || '',
      weight: productData.weight || '',
      border: productData.border || '',
      origin: productData.origin || '',
      sizeGuide: productData.sizeGuide || '',
      extraCharges: productData.extraCharges || '',
      occasion: productData.occasion || [],
      images: imageUrls, 
      createdAt: admin.database.ServerValue.TIMESTAMP,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    };

    await admin.database().ref(`products/${productId}`).set(product);
    console.log('✅ Product added:', productId, 'with', imageUrls.length, 'images');
    
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
    const snapshot = await admin.database().ref(`products/${id}`).once('value');
    if (!snapshot.exists()) {
      return { success: false, error: 'Product not found' };
    }

    const existingProduct = snapshot.val();
    let imageUrls = existingProduct.images || []; 

    if (imageFiles && imageFiles.length > 0) {
      console.log(`🔄 Adding ${imageFiles.length} new images`);
      
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
              console.log(`New image ${i + 1} uploaded:`, url);
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
      name: productData.name,
      description: productData.description,
      category: productData.category,
      price: parseInt(productData.price) || 0,
      originalPrice: parseInt(productData.originalPrice) || 0,
      stock: parseInt(productData.stock) || 0, 
      badge: productData.badge || '',
      material: productData.material || '',
      length: productData.length || '',
      weave: productData.weave || '',
      care: productData.care || '',
      weight: productData.weight || '',
      border: productData.border || '',
      origin: productData.origin || '',
      sizeGuide: productData.sizeGuide || '',
      extraCharges: productData.extraCharges || '',
      occasion: productData.occasion || [],
      images: imageUrls, 
      updatedAt: admin.database.ServerValue.TIMESTAMP
    };

    await admin.database().ref(`products/${id}`).update(updates);
    console.log('Product updated:', id, 'Total images:', imageUrls.length);
    
    return { success: true, productId: id };
  } catch (error) {
    console.error(' Update Error:', error);
    return { success: false, error: error.message };
  }
}

  static async deleteProduct(id) {
    try {
      await admin.database().ref(`products/${id}`).remove();
      console.log(' Product deleted:', id);
      return { success: true };
    } catch (error) {
      console.error(' Delete Error:', error);
      return { success: false, error: error.message };
    }
  }

    static async updateOffer(id, offerData) {
    try {
      const validFields = ['hasOffer', 'offerName', 'offerPrice'];
      const updates = {};

      validFields.forEach(field => {
        if (offerData[field] !== undefined) {
          updates[field] = offerData[field];
        }
      });

      // If turning off offer, clear name & price
      if (offerData.hasOffer === false) {
        updates.offerName = null;
        updates.offerPrice = null;
      }

      // If turning on and price is provided, validate
      if (offerData.hasOffer === true) {
        if (!offerData.offerPrice || offerData.offerPrice <= 0) {
          return { success: false, error: 'Offer price is required and must be > 0' };
        }
        updates.offerPrice = Number(offerData.offerPrice);
        updates.offerName = offerData.offerName?.trim() || 'Special Offer';
      }

      updates.updatedAt = admin.database.ServerValue.TIMESTAMP;

      await admin.database().ref(`products/${id}`).update(updates);

      console.log(`Offer updated for product ${id}:`, updates);
      return { success: true };
    } catch (error) {
      console.error('Update Offer Error:', error);
      return { success: false, error: error.message };
    }
  }

}

module.exports = ProductModel;

