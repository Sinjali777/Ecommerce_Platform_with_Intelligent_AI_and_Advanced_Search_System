import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen]   = useState(false);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        return prev.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item._id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return removeFromCart(id);
    setCartItems(prev =>
      prev.map(item => item._id === id ? { ...item, quantity } : item)
    );
  };

  const clearCart = () => setCartItems([]);

  const totalItems  = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice  = cartItems.reduce((sum, item) => sum + (item.price_npr * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems, cartOpen, setCartOpen,
      addToCart, removeFromCart, updateQuantity,
      clearCart, totalItems, totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);