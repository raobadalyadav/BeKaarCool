"use client"

import { useState, useEffect, useCallback } from "react"
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

// Centralized wishlist management hook - can be used across any component
export function useWishlist(): UseWishlistReturn {
    const { data: session, status } = useSession()
    const { toast } = useToast()

    const [wishlist, setWishlist] = useState<WishlistItem[]>([])
    const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(false)

    const fetchWishlist = useCallback(async () => {
        if (status !== "authenticated") return

        setIsLoading(true)
        try {
            const res = await fetch("/api/wishlist")
            if (res.ok) {
                const data = await res.json()
                const items = data.wishlist || []
                setWishlist(items)
                setWishlistIds(new Set(items.map((p: WishlistItem) => p._id)))
            }
        } catch (error) {
            console.error("Error fetching wishlist:", error)
        } finally {
            setIsLoading(false)
        }
    }, [status])

    useEffect(() => {
        fetchWishlist()
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

        try {
            const res = await fetch("/api/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId })
            })

            if (res.ok) {
                toast({ title: "Added to Wishlist ❤️" })
            } else {
                // Revert on error
                setWishlistIds(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(productId)
                    return newSet
                })
                toast({ title: "Error", variant: "destructive" })
            }
        } catch (error) {
            // Revert on error
            setWishlistIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(productId)
                return newSet
            })
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

        try {
            const res = await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" })

            if (res.ok) {
                toast({ title: "Removed from Wishlist" })
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
