import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        const el2 = document.getElementById(id);
        if (el2) el2.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Column 1 — Brand */}
        <div className="footer-brand">
          <div className="footer-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <span className="footer-logo-icon">⚡</span>
            <span className="footer-logo-text">ElectroV</span>
          </div>
          <p className="footer-desc">
            Your intelligent laptop store powered by AI. Find the perfect laptop
            for your needs with smart recommendations and advanced search.
          </p>
          <div className="footer-contact">
            <p>📍 Kathmandu, Nepal</p>
            <p>📧 electrov@email.com</p>
            <p>📞 +977-9800000000</p>
          </div>
        </div>

        {/* Column 2 — Quick Links */}
        <div className="footer-col">
          <h4 className="footer-col-title">Quick Links</h4>
          <ul className="footer-links">
            <li onClick={() => navigate('/')}>Home</li>
            <li onClick={() => scrollToSection('new-arrivals')}>New Arrivals</li>
            <li onClick={() => scrollToSection('featured-collection')}>Featured Collection</li>
            <li onClick={() => scrollToSection('our-services')}>Our Services</li>
          </ul>
        </div>

        {/* Column 3 — Categories */}
        <div className="footer-col">
          <h4 className="footer-col-title">Categories</h4>
          <ul className="footer-links">
            <li onClick={() => { navigate('/'); setTimeout(() => window.dispatchEvent(new CustomEvent('filter-use-case', { detail: 'gaming' })), 300); }}>🎮 Gaming</li>
            <li onClick={() => { navigate('/'); setTimeout(() => window.dispatchEvent(new CustomEvent('filter-use-case', { detail: 'programming' })), 300); }}>💻 Programming</li>
            <li onClick={() => { navigate('/'); setTimeout(() => window.dispatchEvent(new CustomEvent('filter-use-case', { detail: 'student' })), 300); }}>🎓 Student</li>
            <li onClick={() => { navigate('/'); setTimeout(() => window.dispatchEvent(new CustomEvent('filter-use-case', { detail: 'video editing' })), 300); }}>🎬 Video Editing</li>
            <li onClick={() => { navigate('/'); setTimeout(() => window.dispatchEvent(new CustomEvent('filter-use-case', { detail: 'office' })), 300); }}>💼 Office</li>
            <li onClick={() => { navigate('/'); setTimeout(() => window.dispatchEvent(new CustomEvent('filter-use-case', { detail: 'everyday use' })), 300); }}>📚 Everyday Use</li>
          </ul>
        </div>

        {/* Column 4 — About */}
        <div className="footer-col">
          <h4 className="footer-col-title">About Us</h4>
          <ul className="footer-links">
            <li onClick={() => navigate('/')}>About ElectroV</li>
            <li onClick={() => navigate('/')}>Contact Us</li>
            <li onClick={() => navigate('/')}>Privacy Policy</li>
            <li onClick={() => navigate('/')}>Terms of Service</li>
          </ul>
          <div className="footer-ai-badge">
            <span>🤖</span>
            <span>AI Powered Store</span>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p>© 2025 ElectroV. All rights reserved.</p>
        <p>Built with ⚡ and 🤖 AI</p>
      </div>
    </footer>
  );
}

export default Footer;