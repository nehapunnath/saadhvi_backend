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

      const snapshot = await admin.database().ref('products').once('value');
    let maxOrder = 0;
    snapshot.forEach(child => {
      const val = child.val();
      if (val.displayOrder && val.displayOrder > maxOrder) {
        maxOrder = val.displayOrder;
      }
    });

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
      isVisible: true,
      displayOrder: maxOrder + 1,
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
  static async getProducts(adminView = false) {
    try {
      const snapshot = await admin.database().ref('products').once('value');
      const products = [];
     snapshot.forEach(child => {
        const val = child.val();
        if (adminView || val.isVisible !== false) {      // ← key safety condition
          products.push({ ...val, key: child.key ,
            displayOrder: val.displayOrder || null
          });
        }
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
      product.displayOrder = product.displayOrder || null;
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
      isVisible: productData.isVisible !== undefined
          ? productData.isVisible === 'true' || productData.isVisible === true
          : existingProduct.isVisible ?? true,
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
  static async reorderProducts(orderMap) {   // orderMap = { productId: newDisplayOrder, ... }
    try {
      const updates = {};

      for (const [productId, order] of Object.entries(orderMap)) {
        if (!productId || typeof order !== 'number') continue;
        
        updates[`products/${productId}/displayOrder`] = order;
        updates[`products/${productId}/updatedAt`] = admin.database.ServerValue.TIMESTAMP;
      }

      if (Object.keys(updates).length === 0) {
        return { success: false, error: "No valid updates provided" };
      }

      await admin.database().ref().update(updates);

      console.log(`Reordered ${Object.keys(orderMap).length} products`);
      return { success: true };
    } catch (error) {
      console.error('Reorder products failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Optional helper: Get current order of visible products (useful for debugging)
  static async getVisibleProductsOrder() {
    try {
      const snapshot = await admin.database().ref('products')
        .orderByChild('isVisible')
        .equalTo(true)
        .once('value');

      const ordered = [];
      snapshot.forEach(child => {
        const val = child.val();
        ordered.push({
          id: child.key,
          name: val.name || 'Unnamed',
          displayOrder: val.displayOrder || 9999,
          isVisible: val.isVisible !== false
        });
      });

      // Sort by displayOrder (fallback to createdAt / key if missing)
      ordered.sort((a, b) => {
        const oa = a.displayOrder ?? 999999;
        const ob = b.displayOrder ?? 999999;
        return oa - ob;
      });

      return { success: true, orderedProducts: ordered };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

}

module.exports = ProductModel;

