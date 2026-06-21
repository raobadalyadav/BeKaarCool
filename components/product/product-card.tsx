"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useWishlist } from "@/hooks/use-wishlist"
import { useCart } from "@/contexts/cart-context"

interface ProductCardProps {
  product: any
  viewMode?: "grid" | "list"
  showSaleBadge?: boolean
  showRecommendedBadge?: boolean
}

export function ProductCard({ product, viewMode = "grid", showSaleBadge = false, showRecommendedBadge = false }: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { addToCart } = useCart()

  const productId = product.id ?? product._id
  const defaultVariantId = product.variants?.[0]?.id ?? product.defaultVariantId
  const isWishlisted = isInWishlist(productId)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!defaultVariantId) {
      toast({
        title: "Pick options",
        description: "Open the product to select size/color.",
      })
      return
    }

    setIsLoading(true)
    try {
      await addToCart({ variantId: defaultVariantId, quantity: 1 })
      toast({
        title: "Added to cart!",
        description: `${product.name ?? product.title ?? "Item"} added to your bag.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Please login to add items to cart.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await toggleWishlist(productId)
  }

  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const isOutOfStock = product.stock === 0 || product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock <= 5

  return (
    <Link href={`/products/${product.slug || productId}`} className="block h-full">
      <Card
        className={`group h-full flex flex-col hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer border-0 shadow-none hover:shadow-xl ${viewMode === "list" ? "flex-row" : ""
          } ${isOutOfStock ? "opacity-75" : ""}`}
      >
        <div className={`relative ${viewMode === "list" ? "w-48" : "aspect-[3/4]"}`}>
          <div className="relative w-full h-full overflow-hidden bg-gray-100">
            <Image
              src={product.images?.[0] || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            {/* Rating Overlay on Image Bottom Left - Typical Bewakoof Style */}
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold shadow-sm">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{product.rating || "4.5"}</span>
            </div>
          </div>

          {/* Sale / Featured Badges */}
          {product.saleOffer && (
            <div className="absolute top-0 left-0 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
              {product.saleOffer}
            </div>
          )}
          {!product.saleOffer && product.featured && (
            <div className="absolute top-0 left-0 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
              FEATURED
            </div>
          )}

          {/* Wishlist Button - Top Right */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600 fill-white/50"}`} />
          </button>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="bg-white px-3 py-1 text-xs font-bold text-gray-500 uppercase border border-gray-200 shadow-sm">
                Sold Out
              </span>
            </div>
          )}
        </div>

        <CardContent className={`p-3 flex flex-col flex-1 ${viewMode === "list" ? "justify-center" : ""}`}>
          {/* Brand Name */}
          <div className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase mb-0.5">
            {(() => {
              const b = product.brandName || product.brand || ""
              return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(b) ? "Baefikra" : b || "Baefikra"
            })()}
          </div>

          {/* Product Name */}
          <h3 className="text-xs sm:text-sm text-gray-700 font-normal leading-tight mb-2 line-clamp-2 min-h-[2.5em] group-hover:text-black">
            {product.name}
          </h3>

          {/* Price section - Bottom aligned if needed */}
          <div className="mt-auto flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-gray-900">₹{product.price}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                <span className="text-xs font-bold text-green-600">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          {/* Subscriber Price or extra info (Optional) */}
          <div className="mt-1 text-[10px] text-gray-500 font-medium">
            ₹{Math.floor(product.price * 0.9)} for TriBe Members
          </div>

          {/* Add to Cart - List View Only or Desktop Hover (Optional - keeping clean for mobile-first grid) */}
          {viewMode === "list" && (
            <Button
              onClick={handleAddToCart}
              className="mt-3 w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-8 text-xs"
              disabled={isOutOfStock || isLoading}
            >
              {isOutOfStock ? "Out of Stock" : isLoading ? "Adding..." : "ADD TO BAG"}
            </Button>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
