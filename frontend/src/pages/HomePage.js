// src/pages/HomePage.js

import React, { useState, useEffect } from 'react';
import ProductCard   from '../components/ProductCard';
import HeroCarousel  from '../components/HeroCarousel';
import { getAllProducts, searchProducts, getProductById } from '../services/api';
import { useChat }   from '../context/ChatContext';
import './HomePage.css';

function HomePage({ splitMode, searchQuery, filters = {} }) {
  const [products,    setProducts]    = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [featured,    setFeatured]    = useState([]);
  const [activeTab,   setActiveTab]   = useState('best_rated');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);

  const {
    aiProducts,
    aiSearchActive,
    aiSearchLabel,
    clearAiSearch,
  } = useChat();

  const isFiltering = searchQuery ||
    Object.values(filters).some(v => v !== '');

  // If AI search is active show AI results
  const displayProducts  = aiSearchActive ? aiProducts : products;
  const displayLabel     = aiSearchActive
    ? aiSearchLabel
    : isFiltering ? 'Search Results' : 'Our Services';

  useEffect(() => { setPage(1); }, [searchQuery, filters]);

  useEffect(() => {
    if (!aiSearchActive) fetchProducts();
    // eslint-disable-next-line
  }, [page, searchQuery, filters, aiSearchActive]);

  useEffect(() => {
    if (!isFiltering) fetchNewArrivals();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!isFiltering) fetchFeatured(activeTab);
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      if (searchQuery) {
        const res = await searchProducts(searchQuery);
        setProducts(res.data.data);
        setTotalPages(1);
        return;
      }

      const params = { page, limit: 12 };
      if (filters.brand)         params.brand         = filters.brand;
      if (filters.min_price_npr) params.min_price_npr = filters.min_price_npr;
      if (filters.max_price_npr) params.max_price_npr = filters.max_price_npr;
      if (filters.min_ram)       params.min_ram       = filters.min_ram;
      if (filters.gpu_type)      params.gpu_type      = filters.gpu_type;
      if (filters.use_case)      params.use_case      = filters.use_case;
      if (filters.min_storage)   params.min_storage   = filters.min_storage;

      const res = await getAllProducts(params);
      setProducts(res.data.data);
      setTotalPages(res.data.total_pages);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchNewArrivals = async () => {
    try {
      const res = await getAllProducts({ page: 1, limit: 8 });
      setNewArrivals(res.data.data);
    } catch (err) {}
  };

  const fetchFeatured = async (tab) => {
    try {
      let params = { page: 1, limit: 8 };
      if (tab === 'best_rated')  params.min_rating = 4.5;
      if (tab === 'gaming')      params.use_case   = 'gaming';
      if (tab === 'programming') params.use_case   = 'programming';
      const res = await getAllProducts(params);
      setFeatured(res.data.data);
    } catch (err) {}
  };

  if (loading && !aiSearchActive) return (
    <div className="loading-state">
      <div className="loader" />
      <p>Loading laptops...</p>
    </div>
  );

  if (error) return (
    <div className="error-state">
      <p>⚠️ {error}</p>
      <button onClick={fetchProducts}>Retry</button>
    </div>
  );

  return (
    <div className="homepage">

      {/* Hero Carousel */}
      {!isFiltering && !aiSearchActive && (
        <HeroCarousel products={products} />
      )}

      {/* ── New Arrivals ─────────────────────────────────── */}
      {!isFiltering && !aiSearchActive && newArrivals.length > 0 && (
        <section className="home-section" id="new-arrivals">
          <div className="section-header">
            <h2 className="section-title">New Arrivals</h2>
            <div className="section-title-line" />
          </div>
          <div className={`product-grid ${splitMode ? 'compact-grid' : ''}`}>
            {newArrivals.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                splitMode={splitMode}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Collections ─────────────────────────── */}
      {!isFiltering && !aiSearchActive && (
        <section className="home-section featured-section" id="featured-collection">
          <div className="section-header">
            <h2 className="section-title">Featured Collection</h2>
            <div className="section-title-line" />
          </div>
          <div className="featured-tabs">
            {[
              { key: 'best_rated',  label: '⭐ Best Rated'  },
              { key: 'gaming',      label: '🎮 Gaming'      },
              { key: 'programming', label: '💻 Programming' },
            ].map(tab => (
              <button
                key={tab.key}
                className={`featured-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className={`product-grid ${splitMode ? 'compact-grid' : ''}`}>
            {featured.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                splitMode={splitMode}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Main Results ─────────────────────────────────── */}
      <section className="home-section" id="our-services">
        <div className="section-header">
          <h2 className="section-title">
            {displayLabel}
            <span className="product-count">
              ({displayProducts.length} shown)
            </span>
          </h2>
          <div className="section-title-line" />

          {/* Clear AI search button */}
          {aiSearchActive && (
            <button
              onClick={clearAiSearch}
              style={styles.clearAiBtn}
            >
              ✕ Clear AI Search
            </button>
          )}
        </div>

        {/* AI search banner */}
        {aiSearchActive && (
          <div style={styles.aiBanner}>
            <span style={styles.aiBannerIcon}>🤖</span>
            <span>
              These results were found by ElectroV AI based on your request.
              Clear to see all products.
            </span>
          </div>
        )}

        <div className={`product-grid ${splitMode ? 'compact-grid' : ''}`}>
          {displayProducts.map(product => (
            <ProductCard
              key={product._id}
              product={product}
              splitMode={splitMode}
            />
          ))}
        </div>

        {displayProducts.length === 0 && (
          <div className="empty-state">
            <p>😕 No laptops found matching your filters</p>
            <p>Try adjusting your search or filters</p>
          </div>
        )}

        {/* Pagination — only for normal search */}
        {!aiSearchActive && totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => {
                setPage(p => Math.max(1, p - 1));
                document.getElementById('our-services')
                  .scrollIntoView({ behavior: 'smooth' });
              }}
              disabled={page === 1}
            >
              ← Prev
            </button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="page-btn"
              onClick={() => {
                setPage(p => Math.min(totalPages, p + 1));
                document.getElementById('our-services')
                  .scrollIntoView({ behavior: 'smooth' });
              }}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </section>

    </div>
  );
}

const styles = {
  clearAiBtn: {
    background:   '#fef2f2',
    border:       '1px solid #fecaca',
    color:        '#dc2626',
    padding:      '4px 12px',
    borderRadius: 6,
    cursor:       'pointer',
    fontSize:     13,
    fontWeight:   600,
    marginLeft:   'auto',
  },
  aiBanner: {
    display:      'flex',
    alignItems:   'center',
    gap:          8,
    background:   '#eff6ff',
    border:       '1px solid #bfdbfe',
    borderRadius: 8,
    padding:      '10px 16px',
    marginBottom: 16,
    fontSize:     13,
    color:        '#1d4ed8',
  },
  aiBannerIcon: { fontSize: 18 },
};

export default HomePage;