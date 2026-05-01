"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import * as cartApi from "@/lib/api/cart";
import type { CartDto } from "@/lib/api/types";
import { minorToRupees } from "@/lib/api/config";

export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  /** rupees, derived from priceMinor */
  price: number;
  /** raw paise as string (for accurate checkout math) */
  priceMinor: string;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  addToCart: (input: {
    variantId: string;
    quantity: number;
  }) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const dtoToItems = (cart: CartDto): CartItem[] =>
  cart.items.map((it) => ({
    id: it.id,
    variantId: it.variantId,
    quantity: it.quantity,
    priceMinor: it.priceMinor,
    price: minorToRupees(it.priceMinor),
  }));

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [cart, setCart] = useState<CartDto | null>(null);
  const [loading, setLoading] = useState(false);

  const items = useMemo<CartItem[]>(
    () => (cart ? dtoToItems(cart) : []),
    [cart]
  );
  const total = useMemo(
    () => (cart ? minorToRupees(cart.subtotalMinor) : 0),
    [cart]
  );
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const next = await cartApi.getCart();
      setCart(next);
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Track the last status we fetched for so StrictMode-double-runs and
  // unrelated re-renders don't refire the cart query.
  const lastFetchedStatusRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastFetchedStatusRef.current === status) return;
    lastFetchedStatusRef.current = status;
    refresh();
  }, [status, refresh]);

  const addToCart = useCallback(
    async (input: { variantId: string; quantity: number }) => {
      if (status !== "authenticated") {
        window.location.href = "/auth/login";
        return;
      }
      setLoading(true);
      try {
        const next = await cartApi.addToCart(input.variantId, input.quantity);
        setCart(next);
      } finally {
        setLoading(false);
      }
    },
    [status]
  );

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    setLoading(true);
    try {
      const next = await cartApi.updateCartItem(id, quantity);
      setCart(next);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromCart = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const next = await cartApi.removeFromCart(id);
      setCart(next);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    if (!cart) return;
    await Promise.all(cart.items.map((it) => removeFromCart(it.id)));
  }, [cart, removeFromCart]);

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        itemCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refresh,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
