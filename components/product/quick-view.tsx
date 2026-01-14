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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Heart, ShoppingCart, Star, X, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Product {
    _id: string
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
    const [selectedSize, setSelectedSize] = useState<string>("")
    const [selectedColor, setSelectedColor] = useState<string>("")
    const [currentImage, setCurrentImage] = useState(0)
    const [adding, setAdding] = useState(false)

    if (!product) return null

    const addToCart = async () => {
        if (product.variations?.sizes?.length && !selectedSize) {
            toast({ title: "Please select a size", variant: "destructive" })
            return
        }

        setAdding(true)
        try {
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: product._id,
                    quantity: 1,
                    size: selectedSize || undefined,
                    color: selectedColor || undefined
                })
            })

            if (res.ok) {
                toast({ title: "Added to cart!" })
                onClose()
            } else {
                toast({ title: "Failed to add to cart", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Failed to add to cart", variant: "destructive" })
        } finally {
            setAdding(false)
        }
    }

    const addToWishlist = async () => {
        try {
            const res = await fetch("/api/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product._id })
            })

            if (res.ok) {
                toast({ title: "Added to wishlist!" })
            }
        } catch (error) {
            toast({ title: "Failed to add to wishlist", variant: "destructive" })
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
                                        className={`w-16 h-16 relative rounded border-2 flex-shrink-0 ${currentImage === idx ? "border-yellow-400" : "border-gray-200"
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
                                                    ? "border-yellow-400 bg-yellow-50"
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
                                                    ? "border-yellow-400 ring-2 ring-yellow-200"
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
                                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
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
                            <Button variant="link" className="w-full text-yellow-600">
                                View Full Details <ExternalLink className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
