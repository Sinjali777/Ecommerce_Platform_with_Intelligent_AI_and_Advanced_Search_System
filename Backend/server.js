// server.js

require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const connectDB     = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const chatRoutes    = require('./routes/chatRoutes');

const app = express();

// ── Connect Database ──────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use('/images', express.static('images'));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/products', productRoutes);
app.use('/api/chat',     chatRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message:  'Electronics Store API is running!',
    version:  '2.0',
    endpoints: {
      products:  '/api/products',
      search:    '/api/products/search?q=keyword',
      filter:    '/api/products?brand=Asus&min_ram=16&max_price_npr=150000',
      stats:     '/api/products/stats',
      chat:      '/api/chat',
      history:   '/api/chat/history?session_id=xxx',
    }
  });
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
