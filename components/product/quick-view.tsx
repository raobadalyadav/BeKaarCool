"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Heart, ShoppingCart, Star, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/cart-context"
import { useWishlist } from "@/hooks/use-wishlist"

interface Product {
    _id?: string
    id?: string
    name: string
    slug: string
    images: string[]
    price: number
    originalPrice?: number
    discount?: number
    rating?: number
    reviewCount?: number
    category?: { name: string }
    variations?: {
        sizes?: string[]
        colors?: Array<{ name: string; code: string }>
    }
    variants?: Array<{ id: string }>
    defaultVariantId?: string
    stock?: number
    description?: string
}

interface QuickViewProps {
    product: Product | null
    isOpen: boolean
    onClose: () => void
}

export function QuickView({ product, isOpen, onClose }: QuickViewProps) {
    const { toast } = useToast()
    const cart = useCart()
    const wishlist = useWishlist()
    const [selectedSize, setSelectedSize] = useState<string>("")
    const [selectedColor, setSelectedColor] = useState<string>("")
    const [currentImage, setCurrentImage] = useState(0)
    const [adding, setAdding] = useState(false)

    if (!product) return null

    const productId = product.id ?? product._id ?? ""
    const variantId = product.variants?.[0]?.id ?? product.defaultVariantId

    const addToCart = async () => {
        if (!variantId) {
            toast({ title: "No variant available", variant: "destructive" })
            return
        }
        setAdding(true)
        try {
            await cart.addToCart({ variantId, quantity: 1 })
            toast({ title: "Added to cart!" })
            onClose()
        } catch (error) {
            toast({
                title: "Failed to add to cart",
                description: error instanceof Error ? error.message : "",
                variant: "destructive",
            })
        } finally {
            setAdding(false)
        }
    }

    const addToWishlist = async () => {
        try {
            await wishlist.add(productId)
            toast({ title: "Added to wishlist!" })
        } catch (error) {
            toast({
                title: "Failed to add to wishlist",
                description: error instanceof Error ? error.message : "",
                variant: "destructive",
            })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="sr-only">Quick View</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Images */}
                    <div>
                        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                            <Image
                                src={product.images?.[currentImage] || "/placeholder.svg"}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                            {product.discount && product.discount > 0 && (
                                <Badge className="absolute top-3 left-3 bg-red-500">
                                    {product.discount}% OFF
                                </Badge>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {product.images?.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {product.images.slice(0, 5).map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImage(idx)}
                                        className={`w-16 h-16 relative rounded border-2 flex-shrink-0 ${currentImage === idx ? "border-[#F38508]" : "border-gray-200"
                                            }`}
                                    >
                                        <Image src={img} alt="" fill className="object-cover rounded" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div>
                        {product.category && (
                            <p className="text-sm text-gray-500 mb-1">{product.category.name}</p>
                        )}
                        <h2 className="text-xl font-bold mb-2">{product.name}</h2>

                        {/* Rating */}
                        {product.rating && (
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-sm">
                                    <Star className="w-3 h-3 fill-current" />
                                    {product.rating.toFixed(1)}
                                </div>
                                <span className="text-sm text-gray-500">
                                    ({product.reviewCount || 0} reviews)
                                </span>
                            </div>
                        )}

                        {/* Price */}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl font-bold">₹{product.price}</span>
                            {product.originalPrice && product.originalPrice > product.price && (
                                <>
                                    <span className="text-lg text-gray-400 line-through">
                                        ₹{product.originalPrice}
                                    </span>
                                    <Badge className="bg-green-100 text-green-700">
                                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                    </Badge>
                                </>
                            )}
                        </div>

                        {/* Size Selector */}
                        {product.variations?.sizes && product.variations.sizes.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-medium mb-2">Size</p>
                                <div className="flex flex-wrap gap-2">
                                    {product.variations.sizes.map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${selectedSize === size
                                                    ? "border-[#F38508] bg-orange-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Color Selector */}
                        {product.variations?.colors && product.variations.colors.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-medium mb-2">Color</p>
                                <div className="flex flex-wrap gap-2">
                                    {product.variations.colors.map(color => (
                                        <button
                                            key={color.name}
                                            onClick={() => setSelectedColor(color.name)}
                                            className={`w-8 h-8 rounded-full border-2 ${selectedColor === color.name
                                                    ? "border-[#F38508] ring-2 ring-orange-200"
                                                    : "border-gray-200"
                                                }`}
                                            style={{ backgroundColor: color.code }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stock */}
                        {product.stock !== undefined && (
                            <p className={`text-sm mb-4 ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}>
                                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 mb-4">
                            <Button
                                onClick={addToCart}
                                disabled={adding || (product.stock !== undefined && product.stock <= 0)}
                                className="flex-1 bg-[#F38508] hover:bg-[#D97706] text-black font-bold"
                            >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                {adding ? "Adding..." : "Add to Cart"}
                            </Button>
                            <Button variant="outline" onClick={addToWishlist}>
                                <Heart className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* View Full Details */}
                        <Link href={`/products/${product.slug}`}>
                            <Button variant="link" className="w-full text-[#F38508]">
                                View Full Details <ExternalLink className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
