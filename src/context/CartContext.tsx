'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, DeliveryZone } from '@/types';
import { useStoreConfig } from '@/context/StoreConfigContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  freeDeliveryThreshold: number;
  amountNeededForFreeDelivery: number;
  customerPostcode: string;
  setCustomerPostcode: (postcode: string) => void;
  currentZone: DeliveryZone;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getDeliveryZoneForPostcode, config } = useStoreConfig();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerPostcode, setCustomerPostcodeState] = useState('M9 8DX');
  const [mounted, setMounted] = useState(false);

  // Load cart and postcode from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedCart = localStorage.getItem('kss_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      const savedPostcode = localStorage.getItem('kss_customer_postcode');
      if (savedPostcode) {
        setCustomerPostcodeState(savedPostcode);
      }
    } catch {
      // Fallback
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem('kss_cart', JSON.stringify(cart));
      } catch {
        // Fallback
      }
    }
  }, [cart, mounted]);

  const setCustomerPostcode = (pc: string) => {
    const formatted = pc.toUpperCase().trim();
    setCustomerPostcodeState(formatted);
    try {
      localStorage.setItem('kss_customer_postcode', formatted);
    } catch {
      // Fallback
    }
  };

  const addToCart = (product: Product, quantity = 1) => {
    const availableStock = product.stock !== undefined ? product.stock : 999;
    
    // Check if out of stock
    if (availableStock <= 0) {
      alert(`Sorry, "${product.name}" is currently out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > availableStock) {
          alert(`Only ${availableStock} units available for "${product.name}". Cart updated to max available.`);
          return prev.map((item) =>
            item.product.id === product.id ? { ...item, quantity: availableStock } : item
          );
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      
      const initialQty = Math.min(quantity, availableStock);
      return [...prev, { product, quantity: initialQty }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const availableStock = item.product.stock !== undefined ? item.product.stock : 999;
          if (quantity > availableStock) {
            alert(`Only ${availableStock} units available for "${item.product.name}".`);
            return { ...item, quantity: availableStock };
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce((sum, item) => {
    const price = item.product.offerPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  // Dynamic zone lookup based on customer postcode
  const currentZone = getDeliveryZoneForPostcode(customerPostcode);
  const freeDeliveryThreshold = currentZone.freeThreshold;
  const deliveryCharge =
    subtotal === 0 || subtotal >= freeDeliveryThreshold
      ? 0.00
      : currentZone.charge;

  const totalAmount = subtotal + deliveryCharge;
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        deliveryCharge,
        totalAmount,
        isCartOpen,
        setIsCartOpen,
        freeDeliveryThreshold,
        amountNeededForFreeDelivery,
        customerPostcode,
        setCustomerPostcode,
        currentZone,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
