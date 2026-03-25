// src/components/ChatPanel.js

import React, { useState, useRef, useEffect } from 'react';
import { sendMessage, getChatHistory } from '../services/api';
import { useChat } from '../context/ChatContext';
import './ChatPanel.css';

const SESSION_KEY = 'laptopkinnehainata_chat_session';

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'session_' + Date.now();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// ── Comparison Table Component ────────────────────────────────
function ComparisonTable({ content }) {

  const laptopAMatch = content.match(/Laptop A[:\s]+([^\n]+)/i);
  const laptopBMatch = content.match(/Laptop B[:\s]+([^\n]+)/i);
  const nameA = laptopAMatch ? laptopAMatch[1].trim() : 'Laptop A';
  const nameB = laptopBMatch ? laptopBMatch[1].trim() : 'Laptop B';

  const summaryMatch = content.match(/Summary[:\s]+([^\n]+(?:\n(?!Winner)[^\n]+)*)/i);
  const winnerMatch  = content.match(/Winner[:\s]+([^\n]+)/i);
  const summary = summaryMatch ? summaryMatch[1].trim() : '';
  const winner  = winnerMatch  ? winnerMatch[1].trim()  : '';

  const rows = [];
  const lines = content.split('\n');

  lines.forEach(line => {
    if (!line.includes('|')) return;
    if (line.toLowerCase().startsWith('laptop')) return;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;

    const label  = line.slice(0, colonIdx).trim();
    const values = line.slice(colonIdx + 1).split('|');

    if (values.length >= 2) {
      rows.push({
        label: label,
        a:     values[0].trim(),
        b:     values[1].trim(),
      });
    }
  });

  const getBetter = (label, a, b) => {
    const numA = parseFloat(a.replace(/[^0-9.]/g, ''));
    const numB = parseFloat(b.replace(/[^0-9.]/g, ''));
    if (isNaN(numA) || isNaN(numB)) return { a: false, b: false };
    if (label.toLowerCase() === 'price') {
      return { a: numA < numB, b: numB < numA };
    }
    return { a: numA > numB, b: numB > numA };
  };

  return (
    <div style={tableStyles.wrapper}>

      <div style={tableStyles.header}>
        ⚖️ Laptop Comparison
      </div>

      <div style={tableStyles.tableWrapper}>
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={tableStyles.th}>Spec</th>
              <th style={{ ...tableStyles.th, background: '#1d4ed8' }}>
                🔵 {nameA.length > 30 ? nameA.slice(0, 30) + '...' : nameA}
              </th>
              <th style={{ ...tableStyles.th, background: '#15803d' }}>
                🟢 {nameB.length > 30 ? nameB.slice(0, 30) + '...' : nameB}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((row, i) => {
              const better = getBetter(row.label, row.a, row.b);
              return (
                <tr key={i} style={{
                  background: i % 2 === 0 ? '#f8fafc' : 'white'
                }}>
                  <td style={tableStyles.labelCell}>
                    {row.label}
                  </td>
                  <td style={{
                    ...tableStyles.valueCell,
                    background: better.a ? '#f0fdf4' : 'transparent',
                    fontWeight: better.a ? 700 : 400,
                    color:      better.a ? '#15803d' : '#1e293b',
                  }}>
                    {row.a}
                    {better.a && <span style={tableStyles.betterBadge}>✓</span>}
                  </td>
                  <td style={{
                    ...tableStyles.valueCell,
                    background: better.b ? '#f0fdf4' : 'transparent',
                    fontWeight: better.b ? 700 : 400,
                    color:      better.b ? '#15803d' : '#1e293b',
                  }}>
                    {row.b}
                    {better.b && <span style={tableStyles.betterBadge}>✓</span>}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={3} style={{ padding: 16, color: '#64748b' }}>
                  <pre style={tableStyles.pre}>{content}</pre>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {summary && (
        <div style={tableStyles.summary}>
          📝 {summary}
        </div>
      )}

      {winner && (
        <div style={tableStyles.verdict}>
          🏆 {winner}
        </div>
      )}

    </div>
  );
}

const tableStyles = {
  wrapper: {
    background:   'white',
    borderRadius: 10,
    overflow:     'hidden',
    border:       '1px solid #e2e8f0',
    maxWidth:     '100%',
  },
  header: {
    padding:    '10px 14px',
    background: '#1e293b',
    color:      'white',
    fontWeight: 700,
    fontSize:   13,
  },
  tableWrapper: { overflowX: 'auto' },
  table: {
    width:          '100%',
    borderCollapse: 'collapse',
    fontSize:       12,
  },
  th: {
    padding:    '10px 12px',
    background: '#334155',
    color:      'white',
    fontWeight: 600,
    textAlign:  'left',
    whiteSpace: 'nowrap',
    fontSize:   11,
  },
  labelCell: {
    padding:      '9px 12px',
    fontWeight:   600,
    color:        '#475569',
    whiteSpace:   'nowrap',
    borderRight:  '1px solid #f1f5f9',
    background:   'inherit',
  },
  valueCell: {
    padding:     '9px 12px',
    borderRight: '1px solid #f1f5f9',
    transition:  'background 0.2s',
  },
  betterBadge: {
    marginLeft:   4,
    fontSize:     10,
    color:        '#15803d',
    fontWeight:   700,
  },
  summary: {
    padding:    '10px 14px',
    background: '#f8fafc',
    borderTop:  '1px solid #e2e8f0',
    fontSize:   12,
    color:      '#475569',
    lineHeight: 1.6,
  },
  verdict: {
    padding:    '10px 14px',
    background: '#fefce8',
    borderTop:  '1px solid #fef08a',
    fontSize:   12,
    color:      '#854d0e',
    fontWeight: 600,
  },
  pre: {
    fontSize:   11,
    whiteSpace: 'pre-wrap',
    color:      '#475569',
    margin:     0,
  }
};

function ChatPanel() {
  const [message,  setMessage]  = useState('');
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [sessionId]             = useState(getSessionId);

  const renderMessage = (msg) => {
    const content = msg.content;

    const hasTable = content.includes('|') &&
      (content.includes('Laptop A') || content.includes('Laptop B') ||
       content.match(/\w+:\s+[^\n]+\|[^\n]+/));

    if (hasTable && msg.role === 'assistant') {
      return <ComparisonTable content={content} />;
    }

    return <div className="message-bubble">{content}</div>;
  };

  const bottomRef = useRef(null);
  const { triggerAiSearch, clearAiSearch } = useChat();

  const suggestions = [
    'Best gaming laptop under Rs.1,50,000',
    'Laptop for video editing with 16GB RAM',
    'Compare Asus vs Lenovo',
    'Recommend laptop for students',
    'Best laptop under Rs.80,000',
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

      // ── Trigger search on HomePage with full products ─────
      if (data.search_triggered === true && data.matched_products?.length > 0) {
      triggerAiSearch(
      data.filters,
      data.matched_products,
      `AI found ${data.matched_products.length} laptop${data.matched_products.length > 1 ? 's' : ''} for: "${msg}"`
      );
} else {
  // NEW: This ensures that if the LLM says "NO" (false), 
  // the UI clears any previous search results.
  clearAiSearch(); 
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
          <h3 className="chatpanel-title">LaptopKinneHainaTa AI</h3>
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
            <h4>Hi! I'm LaptopKinneHainaTa AI</h4>
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

                {/* Message bubble or comparison table */}
                {renderMessage(msg)}

                {/* Intent badge */}
                {msg.intent && (
                  <div style={styles.intentBadge}>
                    🎯 {msg.intent.replace(/_/g, ' ')}
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