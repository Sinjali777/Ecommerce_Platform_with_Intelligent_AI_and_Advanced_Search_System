import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/api';
import { useCart } from '../context/CartContext';
import './ProductPage.css';

function ProductPage({ onOpenAI }) {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [added, setAdded]       = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await getProductById(id);
      setProduct(res.data.data);
    } catch (err) {
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
    <div className="pp-loading">
      <div className="loader" />
      <p>Loading product...</p>
    </div>
  );

  if (error) return (
    <div className="pp-error">
      <p>⚠️ {error}</p>
      <button onClick={() => navigate('/')}>Go Back</button>
    </div>
  );

  const cleanModel = product.model.replace(/\(.*?\)/g, '').trim();

  return (
    <div className="product-page">

      {/* Back Button */}
      <button className="pp-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="pp-container">

        {/* Left — Image */}
        <div className="pp-image-section">
          <div className="pp-image-wrapper">
            <img
              src={`http://localhost:5000/${product.image}`}
              alt={cleanModel}
              className="pp-image"
              onError={(e) => {
                e.target.src = 'https://placehold.co/400x300/f1f5f9/3b82f6?text=No+Image';
              }}
            />
          </div>

          {/* Use Case Tags */}
          <div className="pp-use-cases">
            {product.use_case?.map((tag, i) => (
              <span key={i} className="pp-use-case-tag">{tag}</span>
            ))}
          </div>
        </div>

        {/* Right — Details */}
        <div className="pp-details">

          {/* Brand + Rating */}
          <div className="pp-top-row">
            <span className="pp-brand">{product.brand}</span>
            <div className="pp-rating">
              <span className="pp-star">★</span>
              <span>{product.rating?.toFixed(1)}</span>
              <span className="pp-rating-label">/ 5</span>
            </div>
          </div>

          {/* Model Name */}
          <h1 className="pp-model">{cleanModel}</h1>

          {/* Price */}
          <div className="pp-price-box">
            <span className="pp-price-npr">
              Rs. {product.price_npr?.toLocaleString()}
            </span>
            <span className="pp-price-inr">
              ₹{product.price_inr?.toLocaleString()}
            </span>
          </div>

          {/* Divider */}
          <div className="pp-divider" />

          {/* Specs */}
          <h3 className="pp-section-title">Specifications</h3>
          <div className="pp-specs-grid">

            <div className="pp-spec-item">
              <span className="pp-spec-icon">⚡</span>
              <div>
                <p className="pp-spec-label">Processor</p>
                <p className="pp-spec-value">{product.processor?.full_name}</p>
              </div>
            </div>

            <div className="pp-spec-item">
              <span className="pp-spec-icon">💾</span>
              <div>
                <p className="pp-spec-label">RAM</p>
                <p className="pp-spec-value">{product.memory_ram?.full_name}</p>
              </div>
            </div>

            <div className="pp-spec-item">
              <span className="pp-spec-icon">💿</span>
              <div>
                <p className="pp-spec-label">Storage</p>
                <p className="pp-spec-value">
                  {product.storage?.size_gb}GB {product.storage?.type_name}
                </p>
              </div>
            </div>

            <div className="pp-spec-item">
              <span className="pp-spec-icon">🎮</span>
              <div>
                <p className="pp-spec-label">Graphics</p>
                <p className="pp-spec-value">
                  {product.graphics_gpu?.brand} — {product.graphics_gpu?.gpu_type}
                </p>
              </div>
            </div>

            <div className="pp-spec-item">
              <span className="pp-spec-icon">🖥️</span>
              <div>
                <p className="pp-spec-label">Display</p>
                <p className="pp-spec-value">
                  {product.display?.size_inch}" —{' '}
                  {product.display?.resolution_width}x{product.display?.resolution_height}
                  {product.display?.touch_screen ? ' — Touch' : ''}
                </p>
              </div>
            </div>

            <div className="pp-spec-item">
              <span className="pp-spec-icon">💻</span>
              <div>
                <p className="pp-spec-label">Operating System</p>
                <p className="pp-spec-value">{product.os}</p>
              </div>
            </div>

            <div className="pp-spec-item">
              <span className="pp-spec-icon">🛡️</span>
              <div>
                <p className="pp-spec-label">Warranty</p>
                <p className="pp-spec-value">{product.warranty_years} Year(s)</p>
              </div>
            </div>

            <div className="pp-spec-item">
              <span className="pp-spec-icon">📦</span>
              <div>
                <p className="pp-spec-label">Availability</p>
                <p className={`pp-spec-value ${product.inStock ? 'in-stock' : 'out-stock'}`}>
                  {product.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                </p>
              </div>
            </div>

          </div>

          {/* Divider */}
          <div className="pp-divider" />

          {/* Action Buttons */}
          <div className="pp-actions">
            <button
              className={`pp-btn-primary ${added ? 'added' : ''}`}
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              {added ? '✓ Added to Cart!' : '🛒 Add to Cart'}
            </button>
            <button
              className="pp-btn-secondary"
              onClick={onOpenAI}
            >
              🤖 Ask AI About This
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProductPage;