"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, ShoppingBag, Trash2, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch } from "@/store"
import { addToCartLocal } from "@/store/slices/cart-slice"

interface WishlistProduct {
    _id: string
    name: string
    slug: string
    price: number
    originalPrice?: number
    images: string[]
    rating: number
    category: string
    brand?: string
}

export default function WishlistPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { toast } = useToast()
    const dispatch = useAppDispatch()

    const [wishlist, setWishlist] = useState<WishlistProduct[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login?redirect=/wishlist")
            return
        }

        if (status === "authenticated") {
            fetchWishlist()
        }
    }, [status, router])

    const fetchWishlist = async () => {
        try {
            const res = await fetch("/api/wishlist")
            const data = await res.json()
            setWishlist(data.wishlist || [])
        } catch (error) {
            console.error("Error fetching wishlist:", error)
        } finally {
            setLoading(false)
        }
    }

    const removeFromWishlist = async (productId: string) => {
        try {
            await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" })
            setWishlist(prev => prev.filter(p => p._id !== productId))
            toast({ title: "Removed from Wishlist" })
        } catch (error) {
            toast({ title: "Error", variant: "destructive" })
        }
    }

    const moveToCart = (product: WishlistProduct) => {
        dispatch(addToCartLocal({
            productId: product._id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.images?.[0] || "/placeholder.svg",
            quantity: 1,
            size: "M",
            color: "Default"
        }))
        removeFromWishlist(product._id)
        toast({ title: "Moved to Bag!" })
    }

    if (status === "loading" || loading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <div className="animate-pulse">Loading...</div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold">My Wishlist ({wishlist.length})</h1>
            </div>

            {wishlist.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <Heart className="w-10 h-10 text-gray-300" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Your Wishlist is Empty</h2>
                    <p className="text-gray-500">Save items you love by tapping the heart icon.</p>
                    <Link href="/products">
                        <Button className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
                            Start Shopping
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {wishlist.map((product) => (
                        <Card key={product._id} className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-shadow">
                            <Link href={`/products/${product.slug || product._id}`} className="block">
                                <div className="relative aspect-[3/4] bg-gray-100">
                                    <Image
                                        src={product.images?.[0] || "/placeholder.svg"}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        onClick={(e) => { e.preventDefault(); removeFromWishlist(product._id) }}
                                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                                    </button>
                                </div>
                            </Link>

                            <div className="p-3 space-y-2">
                                <p className="text-[10px] text-gray-500 font-semibold uppercase">{product.brand || "BeKaarCool"}</p>
                                <h3 className="text-sm text-gray-800 line-clamp-1">{product.name}</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-gray-900">₹{product.price}</span>
                                    {product.originalPrice && product.originalPrice > product.price && (
                                        <>
                                            <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                                            <span className="text-xs text-green-600 font-bold">
                                                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                            </span>
                                        </>
                                    )}
                                </div>

                                <Button
                                    onClick={() => moveToCart(product)}
                                    className="w-full mt-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xs h-9"
                                >
                                    <ShoppingBag className="w-4 h-4 mr-2" /> Move to Bag
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
