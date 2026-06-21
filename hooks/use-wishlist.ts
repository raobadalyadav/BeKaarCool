"use client";

// Thin proxy — all state lives in WishlistContext (one fetch for the whole app).
// Every component that calls useWishlist() gets the same shared data.
export { useWishlistContext as useWishlist } from "@/contexts/wishlist-context";
