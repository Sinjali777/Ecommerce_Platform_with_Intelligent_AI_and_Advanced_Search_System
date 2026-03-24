import React from 'react';
import { useCart } from '../context/CartContext';
import './CartDrawer.css';

function CartDrawer() {
  const {
    cartItems, cartOpen, setCartOpen,
    removeFromCart, updateQuantity,
    totalPrice, clearCart
  } = useCart();

  if (!cartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="cart-overlay" onClick={() => setCartOpen(false)} />

      {/* Drawer */}
      <div className="cart-drawer">

        {/* Header */}
        <div className="cart-header">
          <h3 className="cart-title">🛒 Your Cart</h3>
          <button className="cart-close" onClick={() => setCartOpen(false)}>✕</button>
        </div>

        {/* Items */}
        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <p>🛍️ Your cart is empty</p>
              <p>Add some laptops to get started!</p>
            </div>
          ) : (
            cartItems.map(item => {
              const cleanModel = item.model.replace(/\(.*?\)/g, '').trim();
              return (
                <div key={item._id} className="cart-item">
                  <div className="cart-item-image">
                    <img
                      src={`http://localhost:5000/${item.image}`}
                      alt={cleanModel}
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/60x60/f1f5f9/3b82f6?text=IMG';
                      }}
                    />
                  </div>
                  <div className="cart-item-info">
                    <p className="cart-item-brand">{item.brand}</p>
                    <p className="cart-item-name">{cleanModel}</p>
                    <p className="cart-item-price">
                      Rs. {(item.price_npr * item.quantity).toLocaleString()}
                    </p>
                  </div>
                  <div className="cart-item-controls">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    >−</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    >+</button>
                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item._id)}
                    >🗑️</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total</span>
              <span className="cart-total-price">
                Rs. {totalPrice.toLocaleString()}
              </span>
            </div>
            <button className="cart-checkout-btn">
              Proceed to Checkout →
            </button>
            <button className="cart-clear-btn" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default CartDrawer;