// routes/chatRoutes.js

const express = require('express');
const router  = express.Router();
const {
  chat,
  getChatHistory,
  clearChat
} = require('../controllers/chatController');

router.post('/',          chat);             // POST /api/chat
router.get('/history',    getChatHistory);   // GET  /api/chat/history
router.delete('/clear',   clearChat);        // DELETE /api/chat/clear

module.exports = router;