"use client";

import type React from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import * as wishlistApi from "@/lib/api/wishlist";
import type { WishlistItemDto } from "@/lib/api/types";

interface WishlistContextValue {
  items: WishlistItemDto[];
  loading: boolean;
  refresh: () => Promise<void>;
  add: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  has: (productId: string) => boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [items, setItems] = useState<WishlistItemDto[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      setItems(await wishlistApi.myWishlist());
    } catch {
      // swallow — rate limit or network blip; don't loop
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (productId: string) => {
      if (status !== "authenticated") {
        window.location.href = "/auth/login";
        return;
      }
      await wishlistApi.addToWishlist(productId);
      await refresh();
    },
    [status, refresh]
  );

  const remove = useCallback(
    async (productId: string) => {
      await wishlistApi.removeFromWishlist(productId);
      setItems((prev) => prev.filter((it) => it.productId !== productId));
    },
    []
  );

  const toggle = useCallback(
    async (productId: string) => {
      const exists = items.some((it) => it.productId === productId);
      return exists ? remove(productId) : add(productId);
    },
    [items, add, remove]
  );

  const has = useCallback(
    (productId: string) => items.some((it) => it.productId === productId),
    [items]
  );

  return (
    <WishlistContext.Provider
      value={{ items, loading, refresh, add, remove, toggle, has, isInWishlist: has, toggleWishlist: toggle }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlistContext() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlistContext must be used inside WishlistProvider");
  return ctx;
}
