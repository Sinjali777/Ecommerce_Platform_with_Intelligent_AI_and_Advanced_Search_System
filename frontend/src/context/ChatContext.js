// src/context/ChatContext.js
// Shares AI chat state across the entire app
// So ChatPanel can trigger searches on HomePage

import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export function ChatProvider({ children }) {

  // AI search results that HomePage listens to
  const [aiFilters,         setAiFilters]         = useState(null);
  const [aiProducts,        setAiProducts]        = useState([]);
  const [aiSearchActive,    setAiSearchActive]    = useState(false);
  const [aiSearchLabel,     setAiSearchLabel]     = useState('');

  // Trigger a search on HomePage from ChatPanel
  const triggerAiSearch = (filters, products, label) => {
    setAiFilters(filters);
    setAiProducts(products);
    setAiSearchActive(true);
    setAiSearchLabel(label || 'AI Search Results');
  };

  // Clear AI search and go back to normal
  const clearAiSearch = () => {
    setAiFilters(null);
    setAiProducts([]);
    setAiSearchActive(false);
    setAiSearchLabel('');
  };

  return (
    <ChatContext.Provider value={{
      aiFilters,
      aiProducts,
      aiSearchActive,
      aiSearchLabel,
      triggerAiSearch,
      clearAiSearch,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);