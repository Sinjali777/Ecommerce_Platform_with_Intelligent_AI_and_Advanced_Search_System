import React from 'react';
import './Layout.css';
import Footer from './Footer';

function Layout({ splitMode, children, chatPanel }) {
  return (
    <div className="layout-wrapper">

      {/* Main Store Area */}
      <div className={`store-panel ${splitMode ? 'split' : 'full'}`}>
        <div className="store-content">
          {children}
          <Footer />
        </div>
      </div>

      {/* Chat Panel — no footer */}
      <div className={`chat-panel ${splitMode ? 'open' : 'closed'}`}>
        {chatPanel}
      </div>

    </div>
  );
}

export default Layout;