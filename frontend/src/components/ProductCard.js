import React, { useMemo } from 'react';
import './ProductCard.css';
import { useNavigate } from 'react-router-dom';

// Generate a stable random discount per product
function getDiscount(id) {
  const discounts = [0, 0, 5, 10, 10, 15, 20, 20, 25, 30];
  const index = id.charCodeAt(id.length - 1) % discounts.length;
  return discounts[index];
}

function ProductCard({ product, splitMode }) {
  const navigate = useNavigate();
  const {
    _id         = '',
    brand       = '',
    model       = '',
    price_npr   = 0,
    price_inr   = 0,
    rating      = 0,
    image       = 'placeholder.webp',
    memory_ram  = {},
    storage     = {},
    graphics_gpu = {},
    processor   = {},
    display     = {},
    use_case    = []
  } = product || {};

  const cleanModel  = (model || brand || 'Unknown').replace(/\(.*?\)/g, '').trim();
  const discount    = useMemo(() => getDiscount(_id), [_id]);
  const originalPrice = discount > 0
    ? Math.round(price_npr / (1 - discount / 100))
    : null;

  return (
    <div
      className={`product-card ${splitMode ? 'compact' : ''}`}
      onClick={() => navigate(`/product/${_id}`)}
    >
      {/* Image */}
      <div className="card-image-wrapper">
        <img
          src={`http://localhost:5000/${image}`}
          alt={cleanModel}
          className="card-image"
          onError={(e) => {
            e.target.src = 'https://placehold.co/300x200/f1f5f9/3b82f6?text=No+Image';
          }}
        />

        {/* Discount Badge */}
        {discount > 0 && (
          <span className="discount-badge">-{discount}%</span>
        )}

        {/* Use case badge */}
        {use_case && use_case[0] && (
          <span className="use-case-badge">{use_case[0]}</span>
        )}
      </div>

      {/* Content */}
      <div className="card-content">

        {/* Brand + Rating */}
        <div className="card-top-row">
          <span className="card-brand">{brand}</span>
          <div className="card-rating">
            <span className="star">★</span>
            <span>{rating?.toFixed(1)}</span>
          </div>
        </div>

        {/* Model Name */}
        <h3 className="card-model">{cleanModel}</h3>

        {/* Specs */}
        <div className="card-specs">
          <span className="spec-chip">
            💾 {memory_ram?.size_gb}GB
          </span>
          <span className="spec-chip">
            💿 {storage?.size_gb}GB
          </span>
          <span className="spec-chip">
            🖥️ {display?.size_inch}"
          </span>
          {graphics_gpu?.gpu_type === 'Dedicated' && (
            <span className="spec-chip dedicated">
              🎮 Dedicated GPU
            </span>
          )}
        </div>

        {/* Processor */}
        <p className="card-processor">
          ⚡ {processor?.series || processor?.brand}
        </p>

        {/* Price + Button */}
        <div className="card-footer">
          <div className="card-price">
            <span className="price-npr">
              Rs. {price_npr?.toLocaleString()}
            </span>
            {originalPrice && (
              <span className="price-original">
                Rs. {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <button
            className="view-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${_id}`);
            }}
          >
            View →
          </button>
        </div>

      </div>
    </div>
  );
}

export default ProductCard;