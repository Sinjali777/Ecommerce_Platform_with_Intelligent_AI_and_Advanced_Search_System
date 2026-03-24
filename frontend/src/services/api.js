// src/services/api.js

import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// ── Products ──────────────────────────────────────────────────
export const getAllProducts  = (params) => API.get('/products', { params });
export const getProductById = (id)      => API.get(`/products/${id}`);
export const searchProducts = (q)       => API.get('/products/search', { params: { q } });
export const getStats       = ()        => API.get('/products/stats');

// ── Chat / AI ─────────────────────────────────────────────────
export const sendMessage    = (message, session_id) =>
  API.post('/chat', { message, session_id });

export const getChatHistory = (session_id) =>
  API.get('/chat/history', { params: { session_id } });

export const clearChatHistory = (session_id) =>
  API.delete('/chat/clear', { params: { session_id } });

export default API;