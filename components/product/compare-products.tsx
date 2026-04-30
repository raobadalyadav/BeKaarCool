"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Scale, X, Star, ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/cart-context"

interface Product {
    _id?: string
    id?: string
    name: string
    slug: string
    images: string[]
    price: number
    originalPrice?: number
    rating?: number
    brand?: string
    category?: { name: string }
    variations?: {
        sizes?: string[]
        colors?: Array<{ name: string; code: string }>
    }
    variants?: Array<{ id: string }>
    defaultVariantId?: string
    description?: string
}

interface CompareProductsProps {
    products: Product[]
    onRemove: (productId: string) => void
    isOpen: boolean
    onClose: () => void
}

export function CompareProducts({ products, onRemove, isOpen, onClose }: CompareProductsProps) {
    const { toast } = useToast()
    const cart = useCart()

    const addToCart = async (product: Product) => {
        const variantId = product.variants?.[0]?.id ?? product.defaultVariantId
        if (!variantId) {
            toast({ title: "Open the product to pick a variant" })
            return
        }
        try {
            await cart.addToCart({ variantId, quantity: 1 })
            toast({ title: `${product.name} added to cart!` })
        } catch (error) {
            toast({
                title: "Failed to add to cart",
                description: error instanceof Error ? error.message : "",
                variant: "destructive",
            })
        }
    }

    const compareFields = [
        { key: "price", label: "Price", render: (p: Product) => `₹${p.price}` },
        { key: "originalPrice", label: "MRP", render: (p: Product) => p.originalPrice ? `₹${p.originalPrice}` : "-" },
        {
            key: "discount", label: "Discount", render: (p: Product) => {
                if (!p.originalPrice || p.originalPrice <= p.price) return "-"
                return `${Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%`
            }
        },
        {
            key: "rating", label: "Rating", render: (p: Product) => p.rating ? (
                <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {p.rating.toFixed(1)}
                </span>
            ) : "-"
        },
        { key: "brand", label: "Brand", render: (p: Product) => p.brand || "-" },
        { key: "category", label: "Category", render: (p: Product) => p.category?.name || "-" },
        { key: "sizes", label: "Sizes", render: (p: Product) => p.variations?.sizes?.join(", ") || "-" },
        {
            key: "colors", label: "Colors", render: (p: Product) => (
                p.variations?.colors?.length ? (
                    <div className="flex gap-1 flex-wrap">
                        {p.variations.colors.map(c => (
                            <span
                                key={c.name}
                                className="w-5 h-5 rounded-full border"
                                style={{ backgroundColor: c.code }}
                                title={c.name}
                            />
                        ))}
                    </div>
                ) : "-"
            )
        }
    ]

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Scale className="w-5 h-5" /> Compare Products ({products.length})
                    </DialogTitle>
                </DialogHeader>

                {products.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        <Scale className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No products to compare</p>
                        <p className="text-sm">Add products from the listing page</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left p-3 bg-gray-50 w-32"></th>
                                    {products.map(product => (
                                        <th key={(product.id ?? product._id ?? "")} className="p-3 bg-gray-50 min-w-[200px]">
                                            <div className="relative">
                                                <button
                                                    onClick={() => onRemove((product.id ?? product._id ?? ""))}
                                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                                <div className="relative aspect-square w-24 mx-auto mb-2 bg-gray-100 rounded">
                                                    <Image
                                                        src={product.images?.[0] || "/placeholder.svg"}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover rounded"
                                                    />
                                                </div>
                                                <Link href={`/products/${product.slug}`}>
                                                    <p className="font-medium text-sm hover:text-yellow-600 line-clamp-2">
                                                        {product.name}
                                                    </p>
                                                </Link>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {compareFields.map(field => (
                                    <tr key={field.key} className="border-b">
                                        <td className="p-3 font-medium text-gray-600 text-sm">
                                            {field.label}
                                        </td>
                                        {products.map(product => (
                                            <td key={(product.id ?? product._id ?? "")} className="p-3 text-center">
                                                {field.render(product)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                <tr>
                                    <td className="p-3"></td>
                                    {products.map(product => (
                                        <td key={(product.id ?? product._id ?? "")} className="p-3 text-center">
                                            <Button
                                                size="sm"
                                                onClick={() => addToCart(product)}
                                                className="bg-yellow-400 hover:bg-yellow-500 text-black"
                                            >
                                                <ShoppingCart className="w-4 h-4 mr-1" /> Add
                                            </Button>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

// Hook for managing compare list
export function useCompareProducts(maxProducts = 4) {
    const [compareList, setCompareList] = useState<Product[]>([])
    const { toast } = useToast()

    const addToCompare = (product: Product) => {
        if (compareList.find(p => (p.id ?? p._id) === (product.id ?? product._id ?? ""))) {
            toast({ title: "Already in compare list" })
            return
        }
        if (compareList.length >= maxProducts) {
            toast({ title: `Maximum ${maxProducts} products can be compared`, variant: "destructive" })
            return
        }
        setCompareList(prev => [...prev, product])
        toast({ title: "Added to compare" })
    }

    const removeFromCompare = (productId: string) => {
        setCompareList(prev => prev.filter(p => (p.id ?? p._id) !== productId))
    }

    const clearCompare = () => {
        setCompareList([])
    }

    const isInCompare = (productId: string) => {
        return compareList.some(p => (p.id ?? p._id) === productId)
    }

    return {
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare
    }
}
