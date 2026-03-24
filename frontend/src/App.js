// src/App.js

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider, useCart }   from './context/CartContext';
import { ChatProvider }            from './context/ChatContext';
import Navbar      from './components/Navbar';
import Layout      from './components/Layout';
import ChatPanel   from './components/ChatPanel';
import CartDrawer  from './components/CartDrawer';
import HomePage    from './pages/HomePage';
import ProductPage from './pages/ProductPage';

function AppContent() {
  const [splitMode, setSplitMode]     = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters]         = useState({});
  const { totalItems, setCartOpen }   = useCart();

  return (
    <BrowserRouter>
      <Navbar
        onSearch={setSearchQuery}
        splitMode={splitMode}
        onToggleSplit={() => setSplitMode(!splitMode)}
        onFiltersChange={setFilters}
        cartCount={totalItems}
        onCartClick={() => setCartOpen(true)}
      />
      <CartDrawer />
      <Layout
        splitMode={splitMode}
        chatPanel={<ChatPanel />}
      >
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                splitMode={splitMode}
                searchQuery={searchQuery}
                filters={filters}
              />
            }
          />
          <Route
            path="/product/:id"
            element={
              <ProductPage
                onOpenAI={() => setSplitMode(true)}
              />
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

function App() {
  return (
    <CartProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </CartProvider>
  );
}

export default App;