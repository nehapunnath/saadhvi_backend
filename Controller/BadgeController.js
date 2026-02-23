const BadgeModel = require('../Models/BadgeModel');

class BadgeController {
  static async getBadges(req, res) {
    try {
      const result = await BadgeModel.getAllBadges();
      if (result.success) {
        res.json({ success: true, badges: result.badges });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async addBadge(req, res) {
    try {
      const result = await BadgeModel.addBadge(req.body);
      if (result.success) {
        res.json({ success: true, message: 'Badge added', badgeId: result.badgeId });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async updateBadge(req, res) {
    try {
      const { id } = req.params;
      const result = await BadgeModel.updateBadge(id, req.body);
      if (result.success) {
        res.json({ success: true, message: 'Badge updated' });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  static async deleteBadge(req, res) {
    try {
      const { id } = req.params;
      const result = await BadgeModel.deleteBadge(id);
      if (result.success) {
        res.json({ success: true, message: 'Badge deleted' });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
}

module.exports = BadgeController;