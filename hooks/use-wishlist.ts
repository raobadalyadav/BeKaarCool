"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

interface WishlistItem {
    _id: string
    name: string
    price: number
    originalPrice?: number
    images: string[]
    rating: number
    category: string
    brand?: string
}

interface UseWishlistReturn {
    wishlist: WishlistItem[]
    isLoading: boolean
    isInWishlist: (productId: string) => boolean
    addToWishlist: (productId: string) => Promise<void>
    removeFromWishlist: (productId: string) => Promise<void>
    toggleWishlist: (productId: string) => Promise<void>
    refetch: () => Promise<void>
}

// Global cache to prevent multiple fetches across component instances
let globalWishlistCache: {
    items: WishlistItem[]
    ids: Set<string>
    lastFetched: number | null
    fetchPromise: Promise<void> | null
} = {
    items: [],
    ids: new Set(),
    lastFetched: null,
    fetchPromise: null
}

// Cache TTL: 30 seconds
const CACHE_TTL = 30000

// Centralized wishlist management hook - can be used across any component
export function useWishlist(): UseWishlistReturn {
    const { data: session, status } = useSession()
    const { toast } = useToast()

    const [wishlist, setWishlist] = useState<WishlistItem[]>(globalWishlistCache.items)
    const [wishlistIds, setWishlistIds] = useState<Set<string>>(globalWishlistCache.ids)
    const [isLoading, setIsLoading] = useState(false)
    const isMountedRef = useRef(true)

    const fetchWishlist = useCallback(async () => {
        if (status !== "authenticated") return

        // Check if cache is still valid
        const now = Date.now()
        if (globalWishlistCache.lastFetched &&
            now - globalWishlistCache.lastFetched < CACHE_TTL &&
            globalWishlistCache.items.length > 0) {
            // Use cached data
            if (isMountedRef.current) {
                setWishlist(globalWishlistCache.items)
                setWishlistIds(globalWishlistCache.ids)
            }
            return
        }

        // If a fetch is already in progress, wait for it
        if (globalWishlistCache.fetchPromise) {
            await globalWishlistCache.fetchPromise
            if (isMountedRef.current) {
                setWishlist(globalWishlistCache.items)
                setWishlistIds(globalWishlistCache.ids)
            }
            return
        }

        setIsLoading(true)

        // Create fetch promise
        globalWishlistCache.fetchPromise = (async () => {
            try {
                const res = await fetch("/api/wishlist")
                if (res.ok) {
                    const data = await res.json()
                    const items = data.wishlist || []
                    const ids = new Set<string>(items.map((p: WishlistItem) => p._id))

                    // Update global cache
                    globalWishlistCache.items = items
                    globalWishlistCache.ids = ids
                    globalWishlistCache.lastFetched = Date.now()
                }
            } catch (error) {
                console.error("Error fetching wishlist:", error)
            } finally {
                globalWishlistCache.fetchPromise = null
            }
        })()

        await globalWishlistCache.fetchPromise

        if (isMountedRef.current) {
            setWishlist(globalWishlistCache.items)
            setWishlistIds(globalWishlistCache.ids)
            setIsLoading(false)
        }
    }, [status])

    useEffect(() => {
        isMountedRef.current = true
        fetchWishlist()
        return () => {
            isMountedRef.current = false
        }
    }, [fetchWishlist])

    const isInWishlist = useCallback((productId: string): boolean => {
        return wishlistIds.has(productId)
    }, [wishlistIds])

    const addToWishlist = useCallback(async (productId: string) => {
        if (status !== "authenticated") {
            toast({
                title: "Login Required",
                description: "Please login to add items to wishlist.",
                variant: "destructive"
            })
            return
        }

        // Optimistic update
        setWishlistIds(prev => new Set(prev).add(productId))
        globalWishlistCache.ids = new Set(globalWishlistCache.ids).add(productId)

        try {
            const res = await fetch("/api/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId })
            })

            if (res.ok) {
                toast({ title: "Added to Wishlist ❤️" })
                // Invalidate cache to refetch next time
                globalWishlistCache.lastFetched = null
            } else {
                // Revert on error
                setWishlistIds(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(productId)
                    return newSet
                })
                globalWishlistCache.ids.delete(productId)
                toast({ title: "Error", variant: "destructive" })
            }
        } catch (error) {
            // Revert on error
            setWishlistIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(productId)
                return newSet
            })
            globalWishlistCache.ids.delete(productId)
        }
    }, [status, toast])

    const removeFromWishlist = useCallback(async (productId: string) => {
        // Optimistic update
        const prevIds = new Set(wishlistIds)
        setWishlistIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(productId)
            return newSet
        })
        setWishlist(prev => prev.filter(p => p._id !== productId))
        globalWishlistCache.ids.delete(productId)
        globalWishlistCache.items = globalWishlistCache.items.filter(p => p._id !== productId)

        try {
            const res = await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" })

            if (res.ok) {
                toast({ title: "Removed from Wishlist" })
                // Invalidate cache
                globalWishlistCache.lastFetched = null
            } else {
                // Revert on error
                setWishlistIds(prevIds)
            }
        } catch (error) {
            setWishlistIds(prevIds)
        }
    }, [wishlistIds, toast])

    const toggleWishlist = useCallback(async (productId: string) => {
        if (isInWishlist(productId)) {
            await removeFromWishlist(productId)
        } else {
            await addToWishlist(productId)
        }
    }, [isInWishlist, addToWishlist, removeFromWishlist])

    return {
        wishlist,
        isLoading,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        refetch: fetchWishlist
    }
}

// Export function to clear cache (e.g., on logout)
export function clearWishlistCache() {
    globalWishlistCache = {
        items: [],
        ids: new Set(),
        lastFetched: null,
        fetchPromise: null
    }
}
