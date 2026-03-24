import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar({ onSearch, splitMode, onToggleSplit, onFiltersChange, cartCount, onCartClick }) {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    brand: '',
    min_price_npr: '',
    max_price_npr: '',
    min_ram: '',
    gpu_type: '',
    use_case: '',
    min_storage: ''
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    onFiltersChange(filters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const empty = {
      brand: '', min_price_npr: '', max_price_npr: '',
      min_ram: '', gpu_type: '', use_case: '', min_storage: ''
    };
    setFilters(empty);
    onFiltersChange(empty);
    setShowFilters(false);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="navbar-container">
      <nav className="navbar">

        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <span className="logo-icon">⚡</span>
          <span className="logo-text">ElectroV</span>
        </div>

        {/* Search */}
        <div className="navbar-search">
          <span className="search-icon-left">🔍</span>
          <input
            type="text"
            placeholder="Search laptops, brands, specs..."
            onChange={(e) => onSearch(e.target.value)}
            className="search-input"
          />
          <button
            className={`filter-icon-btn ${showFilters ? 'active' : ''} ${activeFilterCount > 0 ? 'has-filters' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle Filters"
          >
            🎛️
            {activeFilterCount > 0 && (
              <span className="filter-count">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Right Actions */}
        <div className="navbar-actions">

          {/* Cart Button */}
          <button className="navbar-cart-btn" onClick={onCartClick}>
            🛒
            {cartCount > 0 && (
              <span className="cart-count-badge">{cartCount}</span>
            )}
          </button>

          {/* AI Toggle */}
          <button
            className={`ai-toggle-btn ${splitMode ? 'active' : ''}`}
            onClick={onToggleSplit}
          >
            <span className="ai-btn-icon">{splitMode ? '✕' : '🤖'}</span>
            <span className="ai-btn-text">{splitMode ? 'Close AI' : 'Ask AI'}</span>
            {splitMode && <span className="ai-live-dot" />}
          </button>

        </div>
      </nav>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-grid">

            <div className="filter-group">
              <label className="filter-label">Brand</label>
              <select className="filter-select" value={filters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}>
                <option value="">All Brands</option>
                <option value="Apple">Apple</option>
                <option value="HP">HP</option>
                <option value="Lenovo">Lenovo</option>
                <option value="Asus">Asus</option>
                <option value="Acer">Acer</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Min Price (Rs.)</label>
              <input type="number" className="filter-input"
                placeholder="e.g. 50000" value={filters.min_price_npr}
                onChange={(e) => handleFilterChange('min_price_npr', e.target.value)} />
            </div>

            <div className="filter-group">
              <label className="filter-label">Max Price (Rs.)</label>
              <input type="number" className="filter-input"
                placeholder="e.g. 200000" value={filters.max_price_npr}
                onChange={(e) => handleFilterChange('max_price_npr', e.target.value)} />
            </div>

            <div className="filter-group">
              <label className="filter-label">Min RAM</label>
              <select className="filter-select" value={filters.min_ram}
                onChange={(e) => handleFilterChange('min_ram', e.target.value)}>
                <option value="">Any RAM</option>
                <option value="4">4GB+</option>
                <option value="8">8GB+</option>
                <option value="16">16GB+</option>
                <option value="32">32GB+</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">GPU Type</label>
              <select className="filter-select" value={filters.gpu_type}
                onChange={(e) => handleFilterChange('gpu_type', e.target.value)}>
                <option value="">Any GPU</option>
                <option value="Dedicated">Dedicated</option>
                <option value="Integrated">Integrated</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Use Case</label>
              <select className="filter-select" value={filters.use_case}
                onChange={(e) => handleFilterChange('use_case', e.target.value)}>
                <option value="">Any Use Case</option>
                <option value="gaming">Gaming</option>
                <option value="student">Student</option>
                <option value="programming">Programming</option>
                <option value="video editing">Video Editing</option>
                <option value="office">Office</option>
                <option value="everyday use">Everyday Use</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Min Storage</label>
              <select className="filter-select" value={filters.min_storage}
                onChange={(e) => handleFilterChange('min_storage', e.target.value)}>
                <option value="">Any Storage</option>
                <option value="256">256GB+</option>
                <option value="512">512GB+</option>
                <option value="1000">1TB+</option>
                <option value="2000">2TB+</option>
              </select>
            </div>

          </div>

          <div className="filter-actions">
            <button className="filter-clear-btn" onClick={clearFilters}>✕ Clear All</button>
            <button className="filter-apply-btn" onClick={applyFilters}>✓ Apply Filters</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;