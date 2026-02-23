const { admin } = require('../Config/firebaseAdmin');

class BadgeModel {
  static async getAllBadges() {
    try {
      const snapshot = await admin.database().ref('badges').once('value');
      const badges = [];
      snapshot.forEach(child => {
        badges.push({ 
          id: child.key, 
          ...child.val() 
        });
      });
      
      // Sort by order or name
      badges.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
      
      return { success: true, badges };
    } catch (error) {
      console.error('Get Badges Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async addBadge(badgeData) {
    try {
      const badgeId = admin.database().ref('badges').push().key;
      const badge = {
        id: badgeId,
        name: badgeData.name.trim(),
        order: badgeData.order || 0,
        isActive: badgeData.isActive !== undefined ? badgeData.isActive : true,
        createdAt: admin.database.ServerValue.TIMESTAMP,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      };

      await admin.database().ref(`badges/${badgeId}`).set(badge);
      return { success: true, badgeId, badge };
    } catch (error) {
      console.error('Add Badge Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateBadge(id, badgeData) {
    try {
      const snapshot = await admin.database().ref(`badges/${id}`).once('value');
      if (!snapshot.exists()) {
        return { success: false, error: 'Badge not found' };
      }

      const updates = {
        name: badgeData.name.trim(),
        order: badgeData.order || 0,
        isActive: badgeData.isActive !== undefined ? badgeData.isActive : true,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      };

      await admin.database().ref(`badges/${id}`).update(updates);
      return { success: true, badgeId: id };
    } catch (error) {
      console.error('Update Badge Error:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteBadge(id) {
    try {
      // Optional: check if any product uses this badge
      const productsSnapshot = await admin.database().ref('products').once('value');
      let isUsed = false;
      
      productsSnapshot.forEach(child => {
        if (child.val().badge === id) {
          isUsed = true;
        }
      });

      if (isUsed) {
        return { 
          success: false, 
          error: 'Cannot delete badge. It is being used by some products.' 
        };
      }

      await admin.database().ref(`badges/${id}`).remove();
      return { success: true };
    } catch (error) {
      console.error('Delete Badge Error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = BadgeModel;