// src/components/ChatProductCard.js
// Compact product card shown inside the chat panel

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function ChatProductCard({ product }) {
  const navigate     = useNavigate();
  const { addToCart } = useCart();

  const stars = '★'.repeat(Math.round(product.rating || 0)) +
                '☆'.repeat(5 - Math.round(product.rating || 0));

  return (
    <div style={styles.card}>

      {/* Image */}
      <div style={styles.imgBox}>
        <img
          src={
            product.image && product.image !== 'placeholder.webp'
            ? `http://localhost:5000/images/${product.image}`
            : `http://localhost:5000/images/${product.brand?.toLowerCase()}_${product.model?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 30)}.webp`
          }
          alt={product.model}
          style={styles.img}
          onError={e => {
            e.target.src = 'https://via.placeholder.com/80x60?text=Laptop';
          }}
        />
      </div>

      {/* Info */}
      <div style={styles.info}>
        <div style={styles.brand}>{product.brand}</div>
        <div style={styles.model}>
          {product.model?.length > 35
            ? product.model.slice(0, 35) + '...'
            : product.model}
        </div>

        {/* Key specs */}
        <div style={styles.specs}>
          {product.memory_ram?.size_gb && (
            <span style={styles.spec}>{product.memory_ram.size_gb}GB RAM</span>
          )}
          {product.storage?.size_gb && (
            <span style={styles.spec}>{product.storage.size_gb}GB SSD</span>
          )}
          {product.graphics_gpu?.gpu_type && (
            <span style={{
              ...styles.spec,
              background: product.graphics_gpu.gpu_type === 'Dedicated'
                ? '#dbeafe' : '#f1f5f9',
              color: product.graphics_gpu.gpu_type === 'Dedicated'
                ? '#1d4ed8' : '#475569'
            }}>
              {product.graphics_gpu.gpu_type}
            </span>
          )}
        </div>

        {/* Rating */}
        <div style={styles.rating}>
          <span style={{ color: '#f59e0b', fontSize: 11 }}>{stars}</span>
          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>
            {product.rating?.toFixed(1)}
          </span>
        </div>

        {/* Price + Actions */}
        <div style={styles.bottom}>
          <div style={styles.price}>
            Rs. {product.price_npr?.toLocaleString()}
          </div>
          <div style={styles.actions}>
            <button
              style={styles.btnView}
              onClick={() => navigate(`/product/${product._id}`)}
            >
              View
            </button>
            <button
              style={styles.btnCart}
              onClick={() => addToCart(product)}
            >
              + Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display:      'flex',
    gap:          10,
    background:   'white',
    borderRadius: 10,
    padding:      10,
    marginBottom: 8,
    boxShadow:    '0 1px 4px rgba(0,0,0,0.08)',
    border:       '1px solid #f1f5f9',
  },
  imgBox: {
    width:          80,
    height:         60,
    flexShrink:     0,
    background:     '#f8fafc',
    borderRadius:   6,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
  img: {
    width:     '100%',
    height:    '100%',
    objectFit: 'contain',
  },
  info:  { flex: 1, minWidth: 0 },
  brand: {
    fontSize:      10,
    fontWeight:    700,
    color:         '#2563eb',
    textTransform: 'uppercase',
    marginBottom:  2,
  },
  model: {
    fontSize:     12,
    fontWeight:   600,
    color:        '#1e293b',
    lineHeight:   1.3,
    marginBottom: 4,
  },
  specs: {
    display:      'flex',
    flexWrap:     'wrap',
    gap:          3,
    marginBottom: 4,
  },
  spec: {
    fontSize:     10,
    background:   '#f1f5f9',
    color:        '#475569',
    padding:      '1px 5px',
    borderRadius: 4,
  },
  rating:  { marginBottom: 4 },
  bottom: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  price: {
    fontSize:   12,
    fontWeight: 700,
    color:      '#1e293b',
  },
  actions: {
    display: 'flex',
    gap:     4,
  },
  btnView: {
    fontSize:     10,
    padding:      '3px 8px',
    borderRadius: 4,
    background:   'white',
    border:       '1px solid #2563eb',
    color:        '#2563eb',
    cursor:       'pointer',
    fontWeight:   600,
  },
  btnCart: {
    fontSize:     10,
    padding:      '3px 8px',
    borderRadius: 4,
    background:   '#2563eb',
    border:       'none',
    color:        'white',
    cursor:       'pointer',
    fontWeight:   600,
  },
};

export default ChatProductCard;