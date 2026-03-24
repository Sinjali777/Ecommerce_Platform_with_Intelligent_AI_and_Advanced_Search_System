// controllers/chatController.js

const axios       = require('axios');
const ChatMessage = require('../models/ChatMessage');
const Product     = require('../models/Product');
const { v4: uuidv4 } = require('uuid');

const PYTHON_NLP_URL = process.env.PYTHON_NLP_URL || 'http://localhost:8000';

// ── POST /api/chat ────────────────────────────────────────────
const chat = async (req, res) => {
  try {
    const { message, session_id } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'message is required'
      });
    }

    const sessionId = session_id || uuidv4();

    // Get chat history
    const history = await ChatMessage.find({ session_id: sessionId })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const historyFormatted = history.reverse().map(m => ({
      role:    m.role,
      content: m.content
    }));

    // Save user message
    await ChatMessage.create({
      session_id:       sessionId,
      role:             'user',
      content:          message,
      detected_intent:  null,
      matched_products: [],
      filters_used:     {}
    });

    // Call Python NLP
    const nlpResponse = await axios.post(
      `${PYTHON_NLP_URL}/chat`,
      { message, session_id: sessionId, history: historyFormatted },
      { timeout: 30000 }
    );

    const {
      response,
      intent,
      filters,
      matched_products: nlpProducts,
      search_triggered
    } = nlpResponse.data;

    // ── Fetch full product data from MongoDB ──────────────────
    let fullProducts = [];

    if (search_triggered && nlpProducts?.length > 0) {
      // Build search queries from product names
      const searchPromises = nlpProducts.map(async (nlpProd) => {
        try {
          // Search by brand + partial model name
          const brandName  = nlpProd.brand || nlpProd.product_name.split(' ')[0];
          const modelWords = nlpProd.product_name.split(' ').slice(1, 4).join(' ');

          const product = await Product.findOne({
            $or: [
              // Try exact brand + model match
              {
                brand: { $regex: brandName, $options: 'i' },
                model: { $regex: modelWords, $options: 'i' }
              },
              // Try full name search
              {
                model: { $regex: nlpProd.product_name.slice(0, 30), $options: 'i' }
              }
            ]
          }).lean();

          if (product) {
            return {
              ...product,
              match_score: nlpProd.match_score
            };
          }

          // Fallback — search by price range + RAM
          const fallback = await Product.findOne({
            price_npr: {
              $gte: nlpProd.price_npr * 0.9,
              $lte: nlpProd.price_npr * 1.1
            },
            brand: { $regex: brandName, $options: 'i' }
          }).lean();

          return fallback
            ? { ...fallback, match_score: nlpProd.match_score }
            : null;

        } catch (e) {
          return null;
        }
      });

      const results = await Promise.all(searchPromises);
      fullProducts  = results.filter(Boolean);

      // Remove duplicates by _id
      const seen = new Set();
      fullProducts = fullProducts.filter(p => {
        const id = p._id.toString();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }

    // ── If no MongoDB matches, do a fallback filter search ────
    if (search_triggered && fullProducts.length === 0 && filters) {
      const query = {};

      if (filters.max_price_npr) query.price_npr = { $lte: filters.max_price_npr };
      if (filters.min_price_npr) {
        query.price_npr = { ...query.price_npr, $gte: filters.min_price_npr };
      }
      if (filters.brand) {
        query.brand = { $regex: filters.brand, $options: 'i' };
      }
      if (filters.gpu_type) {
        query['graphics_gpu.gpu_type'] = { $regex: filters.gpu_type, $options: 'i' };
      }
      if (filters.min_ram_gb) {
        query['memory_ram.size_gb'] = { $gte: filters.min_ram_gb };
      }
      if (filters.use_case) {
        query.use_case = { $in: [filters.use_case] };
      }

      fullProducts = await Product.find(query)
        .sort({ rating: -1 })
        .limit(5)
        .lean();
    }

    // Save assistant message
    await ChatMessage.create({
      session_id:       sessionId,
      role:             'assistant',
      content:          response,
      detected_intent:  intent  || null,
      matched_products: fullProducts.map(p => ({
        product_id:   p._id,
        product_name: p.model,
        price_npr:    p.price_npr,
        match_score:  p.match_score || 0
      })),
      filters_used: filters || {}
    });

    res.status(200).json({
      success:          true,
      session_id:       sessionId,
      response,
      intent:           intent           || null,
      filters:          filters          || {},
      matched_products: fullProducts,
      search_triggered: search_triggered || false
    });

  } catch (error) {
    console.error('Chat error:', error.code, error.message);

    let msg = error.message;
    if (error.code === 'ECONNREFUSED') {
      msg = 'NLP service is not running. Start Python server on port 8000.';
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      msg = 'NLP service timed out. It may still be loading.';
    } else if (error.response) {
      msg = `NLP error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
    }

    res.status(500).json({ success: false, message: msg });
  }
};

// ── GET /api/chat/history ─────────────────────────────────────
const getChatHistory = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'session_id is required'
      });
    }

    const messages = await ChatMessage.find({ session_id })
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count:   messages.length,
      data:    messages
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE /api/chat/clear ────────────────────────────────────
const clearChat = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'session_id is required'
      });
    }

    await ChatMessage.deleteMany({ session_id });

    res.status(200).json({
      success: true,
      message: `Chat cleared for session ${session_id}`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { chat, getChatHistory, clearChat };