"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

export interface CartItem {
  id: string; // identificador único: ${productId}-${variationName}-${warrantyId}
  productId: string | number;
  name: string;
  slug: string;
  variationName: string;
  warrantyName?: string;
  price: number;
  isQuoteOnly: boolean;
  imageUrl: string | null;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id"> & { id?: string }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  hasQuoteOnlyItems: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "haka_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Carrega os itens do localStorage após montagem no cliente (evita mismatch de SSR)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho do localStorage:", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Salva no localStorage sempre que os itens mudarem, somente após hidratação inicial
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Erro ao salvar carrinho no localStorage:", error);
    }
  }, [items, isHydrated]);

  // Adiciona um item ou incrementa a quantidade se já existir
  const addItem = (item: Omit<CartItem, "id"> & { id?: string }) => {
    const uniqueId = item.id || `${item.productId}-${item.variationName || "default"}-${item.warrantyName || "standard"}`;
    
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.id === uniqueId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + (item.quantity || 1),
        };
        return updated;
      }
      return [
        ...prevItems,
        {
          ...item,
          id: uniqueId,
          quantity: item.quantity || 1,
        },
      ];
    });

    // Abre o carrinho para dar feedback visual
    setIsCartOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.isQuoteOnly) return sum;
      return sum + item.price * item.quantity;
    }, 0);
  }, [items]);

  const hasQuoteOnlyItems = useMemo(() => {
    return items.some((item) => item.isQuoteOnly);
  }, [items]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        hasQuoteOnlyItems,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser utilizado dentro de um CartProvider");
  }
  return context;
}
