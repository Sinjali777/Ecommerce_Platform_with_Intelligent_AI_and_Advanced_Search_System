// controllers/productController.js

const Product = require('../models/Product');

// ── GET /api/products ─────────────────────────────────────────
// Supports query params:
//   brand, min_ram, max_price_npr, min_price_npr,
//   gpu_type, use_case, min_storage, page, limit
const getAllProducts = async (req, res) => {
  try {
    const {
      brand,
      min_ram,
      max_price_npr,
      min_price_npr,
      gpu_type,
      use_case,
      min_storage,
      min_rating,
      page  = 1,
      limit = 20
    } = req.query;

    // Build MongoDB filter object
    const filter = {};

    if (brand) {
      filter.brand = { $regex: brand, $options: 'i' };
    }

    if (min_ram) {
      filter['memory_ram.size_gb'] = { $gte: parseFloat(min_ram) };
    }

    if (max_price_npr || min_price_npr) {
      filter.price_npr = {};
      if (max_price_npr) filter.price_npr.$lte = parseFloat(max_price_npr);
      if (min_price_npr) filter.price_npr.$gte = parseFloat(min_price_npr);
    }

    if (gpu_type) {
      filter['graphics_gpu.gpu_type'] = { $regex: gpu_type, $options: 'i' };
    }

    if (use_case) {
      filter.use_case = { $in: [use_case.toLowerCase()] };
    }

    if (min_storage) {
      filter['storage.size_gb'] = { $gte: parseFloat(min_storage) };
    }

    if (min_rating) {
      filter.rating = { $gte: parseFloat(min_rating) };
    }

    // Pagination
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort({ rating: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success:      true,
      total,
      page:         parseInt(page),
      total_pages:  Math.ceil(total / parseInt(limit)),
      count:        products.length,
      data:         products
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/products/:id ─────────────────────────────────────
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/products ────────────────────────────────────────
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── PUT /api/products/:id ─────────────────────────────────────
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE /api/products/:id ──────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/products/search?q=keyword ───────────────────────
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query param q is required' });
    }

    const regex = { $regex: q, $options: 'i' };

    const products = await Product.find({
      $or: [
        { brand: regex },
        { model: regex },
        { 'processor.full_name': regex },
        { 'processor.series': regex },
        { 'graphics_gpu.gpu_type': regex },
        { use_case: { $in: [new RegExp(q, 'i')] } },
        { os: regex }
      ]
    }).sort({ rating: -1 }).limit(20);

    res.status(200).json({
      success: true,
      count:   products.length,
      data:    products
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/products/stats ───────────────────────────────────
const getStats = async (req, res) => {
  try {
    const total    = await Product.countDocuments();
    const brands   = await Product.distinct('brand');
    const minPrice = await Product.findOne().sort({ price_npr:  1 }).select('price_npr');
    const maxPrice = await Product.findOne().sort({ price_npr: -1 }).select('price_npr');
    const avgRating = await Product.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_products:  total,
        brands:          brands,
        price_range_npr: {
          min: minPrice?.price_npr  || 0,
          max: maxPrice?.price_npr  || 0
        },
        average_rating: avgRating[0]?.avg?.toFixed(2) || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getStats
};