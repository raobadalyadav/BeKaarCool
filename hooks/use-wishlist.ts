"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { clientFetch } from "@/lib/api/client";
import type { WishlistItemDto } from "@/lib/api/types";

/**
 * Hook for wishlist management. Backed by the NestJS wishlist API via the
 * Next.js /api/wishlist proxy.
 */
export function useWishlist() {
  const { status } = useSession();
  const [items, setItems] = useState<WishlistItemDto[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      setItems([]);
      return;
    }
    try {
      setLoading(true);
      const data = await clientFetch<WishlistItemDto[]>("/api/wishlist");
      setItems(data);
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
      await clientFetch("/api/wishlist", {
        method: "POST",
        body: JSON.stringify({ productId }),
      });
      await refresh();
    },
    [status, refresh]
  );

  const remove = useCallback(
    async (productId: string) => {
      await clientFetch("/api/wishlist", {
        method: "DELETE",
        body: JSON.stringify({ productId }),
      });
      await refresh();
    },
    [refresh]
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

  return {
    items,
    loading,
    refresh,
    add,
    remove,
    toggle,
    has,
    // back-compat aliases for existing components
    isInWishlist: has,
    toggleWishlist: toggle,
  };
}
