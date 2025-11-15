const CarouselModel = require('../Models/GalleryModel');

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
}

module.exports = GalleryController;