import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroCarousel.css';

function HeroCarousel({ products }) {
  const [current, setCurrent]   = useState(0);
  const [animating, setAnimating] = useState(false);
  const navigate                = useNavigate();

  const trending = products.slice(0, 3);

  const goTo = useCallback((index) => {
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 300);
  }, []);

  const goToNext = useCallback(() => {
    setCurrent(prev => (prev + 1) % trending.length);
  }, [trending.length]);

  const goToPrev = () => {
    setCurrent(prev => (prev - 1 + trending.length) % trending.length);
  };

  useEffect(() => {
    if (trending.length === 0) return;
    const timer = setInterval(goToNext, 5000);
    return () => clearInterval(timer);
  }, [goToNext, trending.length]);

  if (trending.length === 0) return null;

  const product   = trending[current];
  const cleanModel = product.model.replace(/\(.*?\)/g, '').trim();

  return (
    <div className="hero-carousel">
      <div className="hero-glow" />

      <div className={`hero-content ${animating ? 'fade' : ''}`}>
        <div className="hero-info">
          <div className="trending-badge">🔥 Trending Now</div>
          <span className="hero-brand">{product.brand}</span>
          <h2 className="hero-model">{cleanModel}</h2>

          <div className="hero-specs">
            <div className="hero-spec">
              <span className="hero-spec-icon">💾</span>
              <span>{product.memory_ram?.size_gb}GB RAM</span>
            </div>
            <div className="hero-spec">
              <span className="hero-spec-icon">💿</span>
              <span>{product.storage?.size_gb}GB SSD</span>
            </div>
            <div className="hero-spec">
              <span className="hero-spec-icon">🖥️</span>
              <span>{product.display?.size_inch}" Display</span>
            </div>
            <div className="hero-spec">
              <span className="hero-spec-icon">⚡</span>
              <span>{product.processor?.series || product.processor?.brand}</span>
            </div>
          </div>

          <div className="hero-price">
            <span className="hero-price-npr">
              Rs. {product.price_npr?.toLocaleString()}
            </span>
            <span className="hero-price-inr">
              ₹{product.price_inr?.toLocaleString()}
            </span>
          </div>

          <button
            className="hero-cta"
            onClick={() => navigate(`/product/${product._id}`)}
          >
            View Details →
          </button>
        </div>

        <div className="hero-image-wrapper">
          <img
            src={`http://localhost:5000/${product.image}`}
            alt={cleanModel}
            className="hero-image"
            onError={(e) => {
              e.target.src = 'https://placehold.co/400x280/1e293b/3b82f6?text=No+Image';
            }}
          />
        </div>
      </div>

      <button className="hero-arrow left" onClick={goToPrev}>‹</button>
      <button className="hero-arrow right" onClick={goToNext}>›</button>

      <div className="hero-dots">
        {trending.map((_, i) => (
          <button
            key={i}
            className={`hero-dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      <div className="hero-progress">
        <div key={current} className="hero-progress-bar" />
      </div>
    </div>
  );
}

export default HeroCarousel;