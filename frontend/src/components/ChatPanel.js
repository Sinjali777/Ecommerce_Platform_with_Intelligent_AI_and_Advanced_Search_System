// src/components/ChatPanel.js

import React, { useState, useRef, useEffect } from 'react';
import { sendMessage, getChatHistory } from '../services/api';
import { useChat } from '../context/ChatContext';
import ChatProductCard from './ChatProductCard';
import './ChatPanel.css';

const SESSION_KEY = 'electrov_chat_session';

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'session_' + Date.now();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function ChatPanel() {
  const [message,  setMessage]  = useState('');
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [sessionId]             = useState(getSessionId);
  const bottomRef               = useRef(null);
  const { triggerAiSearch, clearAiSearch } = useChat();

  const suggestions = [
    'Best gaming laptop under Rs.1,50,000',
    'Laptop for video editing with 16GB RAM',
    'Compare Asus vs Lenovo',
    'Recommend laptop for students',
    'Best laptop under Rs.80,000',
  ];

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line
  }, []);

  const loadHistory = async () => {
    try {
      const res = await getChatHistory(sessionId);
      if (res.data.data?.length > 0) {
        const formatted = res.data.data.map(m => ({
          role:             m.role,
          content:          m.content,
          matched_products: m.matched_products || [],
          filters:          m.filters_used     || {},
          intent:           m.detected_intent  || null,
          time: new Date(m.createdAt).toLocaleTimeString(
            [], { hour: '2-digit', minute: '2-digit' }
          ),
        }));
        setMessages(formatted);
      }
    } catch (e) {}
  };

  const handleSend = async (text) => {
    const msg = text || message;
    if (!msg.trim() || loading) return;

    setMessage('');

    // Add user message
    const userMsg = {
      role:    'user',
      content: msg,
      time:    new Date().toLocaleTimeString(
                 [], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res  = await sendMessage(msg, sessionId);
      const data = res.data;

      // Build assistant message
      const assistantMsg = {
        role:             'assistant',
        content:          data.response,
        matched_products: data.matched_products || [],
        filters:          data.filters          || {},
        intent:           data.intent           || null,
        time: new Date().toLocaleTimeString(
                [], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);

// ── Trigger search on HomePage with full products ─────────
if (data.search_triggered && data.matched_products?.length > 0) {
  triggerAiSearch(
    data.filters,
    data.matched_products,
    `AI found ${data.matched_products.length} laptop${data.matched_products.length > 1 ? 's' : ''} for: "${msg}"`
  );
}

    } catch (e) {
      const errMsg = e.response?.data?.message ||
        'Could not connect to AI. Make sure the server is running.';
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: '❌ ' + errMsg,
        time:    new Date().toLocaleTimeString(
                   [], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem(SESSION_KEY);
    setMessages([]);
    clearAiSearch();
    window.location.reload();
  };

  return (
    <div className="chatpanel-wrapper">

      {/* Header */}
      <div className="chatpanel-header">
        <span className="chatpanel-icon">🤖</span>
        <div>
          <h3 className="chatpanel-title">ElectroV AI</h3>
          <p className="chatpanel-subtitle">Ask me anything about laptops</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="chatpanel-live">
            <span className="live-dot" />
            <span>Live</span>
          </div>
          <button
            onClick={handleClear}
            style={styles.clearBtn}
            title="Clear chat"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="chatpanel-body">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="welcome-icon">⚡</div>
            <h4>Hi! I'm ElectroV AI</h4>
            <p>Ask me to find, compare, or recommend laptops!</p>
            <div className="suggestion-chips">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="chip"
                  onClick={() => handleSend(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>

                {/* Message bubble */}
                <div className="message-bubble">{msg.content}</div>

                {/* Intent badge */}
                {msg.intent && (
                  <div style={styles.intentBadge}>
                    🎯 {msg.intent.replace(/_/g, ' ')}
                  </div>
                )}

                {/* Matched products */}
                {msg.matched_products?.length > 0 && (
                  <div style={styles.productsSection}>
                    <div style={styles.productsTitle}>
                      📦 {msg.matched_products.length} matching laptop
                      {msg.matched_products.length > 1 ? 's' : ''} found
                      — also shown on left →
                    </div>
                    {msg.matched_products.slice(0, 3).map((p, j) => (
                      <ChatProductCard key={j} product={p} />
                    ))}
                    {msg.matched_products.length > 3 && (
                      <div style={styles.moreProducts}>
                        +{msg.matched_products.length - 3} more shown in results
                      </div>
                    )}
                  </div>
                )}

                <span className="message-time">{msg.time}</span>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="chat-message assistant">
                <div className="message-bubble" style={styles.typing}>
                  <span style={styles.dot} />
                  <span style={styles.dot} />
                  <span style={styles.dot} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="chatpanel-input">
        <input
          type="text"
          placeholder="Ask about laptops..."
          className="chat-input"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <button
          className="chat-send-btn"
          onClick={() => handleSend()}
          disabled={loading || !message.trim()}
        >
          {loading ? '⏳' : '➤'}
        </button>
      </div>

    </div>
  );
}

const styles = {
  clearBtn: {
    background:   'none',
    border:       'none',
    cursor:       'pointer',
    fontSize:     16,
    padding:      4,
    borderRadius: 4,
    opacity:      0.7,
  },
  intentBadge: {
    display:      'inline-block',
    fontSize:     10,
    background:   '#eff6ff',
    color:        '#2563eb',
    padding:      '2px 8px',
    borderRadius: 10,
    marginTop:    4,
    fontWeight:   600,
  },
  productsSection: {
    marginTop:    10,
    paddingTop:   10,
    borderTop:    '1px solid #f1f5f9',
  },
  productsTitle: {
    fontSize:     11,
    fontWeight:   600,
    color:        '#64748b',
    marginBottom: 8,
  },
  moreProducts: {
    fontSize:  11,
    color:     '#94a3b8',
    textAlign: 'center',
    padding:   '4px 0',
  },
  typing: {
    display:    'flex',
    gap:        4,
    alignItems: 'center',
    padding:    '8px 12px',
  },
  dot: {
    width:        7,
    height:       7,
    borderRadius: '50%',
    background:   '#94a3b8',
    display:      'inline-block',
    animation:    'pulse 1.2s infinite',
  },
};

export default ChatPanel;