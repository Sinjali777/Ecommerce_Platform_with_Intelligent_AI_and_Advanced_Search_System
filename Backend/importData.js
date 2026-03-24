// importData.js

const mongoose = require('mongoose');
const dns      = require('dns');
const fs       = require('fs');
const path     = require('path');
require('dotenv').config();

dns.setServers(['8.8.8.8', '8.8.4.4']);

const Product = require('./models/Product');

// ── Currency conversion ───────────────────────────────────────
const INR_TO_NPR = 1.6;

// ── FIXED laptop indices (always picks the same 100) ─────────
// Apple: 20, HP: 25, Lenovo: 25, Asus: 20, Acer: 10
const FIXED_INDICES = new Set([
  732, 223, 20, 134, 830, 729, 47, 730, 83, 48,
  728, 833, 53, 69, 831, 829, 834, 837, 105, 461,
  975, 1011, 706, 884, 66, 597, 846, 390, 985, 707,
  783, 145, 922, 42, 316, 881, 856, 82, 773, 315,
  921, 715, 418, 121, 563, 99, 68, 681, 507, 445,
  323, 770, 876, 1017, 935, 467, 878, 894, 858, 382,
  960, 107, 517, 381, 815, 923, 598, 595, 202, 740,
  677, 154, 538, 152, 768, 956, 987, 257, 436, 273,
  78, 914, 633, 246, 292, 352, 139, 447, 311, 446,
  422, 695, 58, 351, 218, 993, 516, 93, 696, 591
]);

// ── CSV Parser ────────────────────────────────────────────────
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines   = content.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = [];
    let current  = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((header, i) => {
      row[header.trim()] = values[i] ? values[i].trim() : '';
    });
    return row;
  });
}

// ── Pick exact 100 laptops by fixed indices ───────────────────
function pickLaptops(data) {
  return data.filter(row => FIXED_INDICES.has(parseInt(row.index)));
}

// ── Infer use_case tags ───────────────────────────────────────
function inferUseCases(row) {
  const tags    = new Set();
  const ram     = parseFloat(row.ram_num)    || 0;
  const storage = parseFloat(row.memory_size) || 0;
  const gpu     = (row.gpu_type   || '').toLowerCase();
  const tier    = (row.iter       || '').toLowerCase();
  const proc    = (row.processor  || '').toLowerCase();

  if (gpu.includes('dedicated') || gpu.includes('discrete')) {
    tags.add('gaming');
    tags.add('video editing');
  }
  if (proc.includes('i9') || tier.includes('ryzen 9')) {
    tags.add('high performance');
    tags.add('3d rendering');
    tags.add('video editing');
  }
  if (proc.includes('i7') || tier.includes('ryzen 7') || tier.includes('core ultra 7')) {
    tags.add('programming');
    tags.add('content creation');
    tags.add('multitasking');
  }
  if (proc.includes('i5') || tier.includes('ryzen 5')) {
    tags.add('student');
    tags.add('everyday use');
    tags.add('office');
  }
  if (ram >= 32) {
    tags.add('video editing');
    tags.add('high performance');
    tags.add('programming');
  } else if (ram >= 16) {
    tags.add('programming');
    tags.add('multitasking');
    tags.add('video editing');
  } else if (ram <= 8) {
    tags.add('student');
    tags.add('office');
    tags.add('everyday use');
  }
  if (storage >= 1000) {
    tags.add('video editing');
    tags.add('gaming');
  }
  if (tags.size === 0) tags.add('general use');

  return Array.from(tags);
}

// ── Map CSV row → Product ─────────────────────────────────────
function mapToProduct(row) {
  const price_inr = parseFloat(row.price) || 0;
  const price_npr = Math.round(price_inr * INR_TO_NPR);

  return {
    brand:     row.brand_name,
    model:     row.model,
    price_inr,
    price_npr,
    rating:    parseFloat(row.rating) || 0,
    use_case:  inferUseCases(row),

    processor: {
      full_name: row.processor,
      brand:     row.processor_brand,
      series:    row.iter,
      cores:     parseFloat(row.core_num)    || 0,
      threads:   parseFloat(row.threads_num) || 0
    },

    memory_ram: {
      full_name: row.ram,
      size_gb:   parseFloat(row.ram_num) || 0,
      ram_type:  row.memory_type
    },

    storage: {
      type_name: row.memory_type,
      size_gb:   parseFloat(row.memory_size) || 0
    },

    graphics_gpu: {
      brand:    row.gpu_brand,
      gpu_type: row.gpu_type
    },

    display: {
      size_inch:          parseFloat(row.display_size)       || 0,
      resolution_width:   parseFloat(row.resolutioin_width)  || 0,
      resolution_height:  parseFloat(row.resolutioin_height) || 0,
      touch_screen:       row.Touch_Screen === 'True'
    },

    os:             row.os,
    warranty_years: parseFloat(row.warrenty) || 0,
    image:          'placeholder.webp',
    inStock:        true
  };
}

// ── Main ──────────────────────────────────────────────────────
async function importData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    const csvPath = path.join(__dirname, 'laptops_cleaned_v1.csv');
    const allData = parseCSV(csvPath);
    console.log(`📂 Loaded ${allData.length} rows from CSV`);

    const selected = pickLaptops(allData);
    console.log(`🎯 Selected ${selected.length} laptops (fixed set)`);

    const products = selected.map(mapToProduct);

    await Product.insertMany(products);
    console.log(`🚀 Imported ${products.length} laptops into MongoDB!`);

    const summary = {};
    products.forEach(p => {
      summary[p.brand] = (summary[p.brand] || 0) + 1;
    });
    console.log('\n📊 Brand Summary:');
    Object.entries(summary).forEach(([brand, count]) => {
      console.log(`   ${brand}: ${count} laptops`);
    });

    console.log('\n💰 Sample Prices (first 3):');
    products.slice(0, 3).forEach(p => {
      console.log(`   ${p.brand} — ${p.model.slice(0, 40)}`);
      console.log(`   INR: ₹${p.price_inr.toLocaleString()} → NPR: Rs.${p.price_npr.toLocaleString()}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

importData();
