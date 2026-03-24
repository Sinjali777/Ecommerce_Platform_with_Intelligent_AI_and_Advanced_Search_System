// routes/productRoutes.js

const express = require('express');
const router  = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getStats
} = require('../controllers/productController');

// ── Product routes ────────────────────────────────────────────
router.get('/stats',    getStats);          // GET /api/products/stats
router.get('/search',   searchProducts);    // GET /api/products/search?q=gaming
router.get('/',         getAllProducts);    // GET /api/products?brand=Asus&min_ram=16
router.get('/:id',      getProductById);   // GET /api/products/:id
router.post('/',        createProduct);    // POST /api/products
router.put('/:id',      updateProduct);    // PUT /api/products/:id
router.delete('/:id',   deleteProduct);    // DELETE /api/products/:id

module.exports = router;