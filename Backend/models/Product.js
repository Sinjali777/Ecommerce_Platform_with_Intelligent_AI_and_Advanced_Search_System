// models/Product.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

  // ── Basic Info ──────────────────────────────────────────────
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },

  // ── Pricing (NPR) ───────────────────────────────────────────
  price_inr: {
    type: Number,
    required: true
  },
  price_npr: {
    type: Number,
    required: true
  },

  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },

  // ── Use Case Tags ────────────────────────────────────────────
  // e.g. ["gaming", "video editing", "student", "programming"]
  use_case: {
    type: [String],
    default: []
  },

  // ── Processor ────────────────────────────────────────────────
  processor: {
    full_name:  String,
    brand:      String,
    series:     String,
    cores:      Number,
    threads:    Number
  },

  // ── RAM ──────────────────────────────────────────────────────
  memory_ram: {
    full_name:  String,
    size_gb:    Number,
    ram_type:   String
  },

  // ── Storage ──────────────────────────────────────────────────
  storage: {
    type_name:  String,
    size_gb:    Number
  },

  // ── GPU ──────────────────────────────────────────────────────
  graphics_gpu: {
    brand:      String,
    gpu_type:   String    // "Integrated" or "Dedicated"
  },

  // ── Display ──────────────────────────────────────────────────
  display: {
    size_inch:          Number,
    resolution_width:   Number,
    resolution_height:  Number,
    touch_screen:       Boolean
  },

  // ── Other ─────────────────────────────────────────────────────
  os:             String,
  warranty_years: Number,
  image: {
    type:    String,
    default: 'placeholder.webp'
  },
  inStock: {
    type:    Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);