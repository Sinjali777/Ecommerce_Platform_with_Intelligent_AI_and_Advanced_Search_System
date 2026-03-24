// models/ChatMessage.js

const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({

  session_id: {
    type:     String,
    required: true,
    index:    true
  },

  role: {
    type:     String,
    enum:     ['user', 'assistant'],
    required: true
  },

  content: {
    type:     String,
    required: true
  },

  // Metadata from NLP pipeline
  detected_intent: {
    type: String,
    default: null
  },

  matched_products: [{
    product_id:   String,
    product_name: String,
    price_npr:    Number,
    match_score:  Number
  }],

  filters_used: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }

}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);