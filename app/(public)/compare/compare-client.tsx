"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Trash2, ShoppingBag, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CompareItem {
    id: string
    name: string
    image: string
    price: number
}

export default function CompareClient() {
    const [items, setItems] = useState<CompareItem[]>([])

    useEffect(() => {
        const stored = localStorage.getItem("bf_compare")
        if (stored) {
            try {
                setItems(JSON.parse(stored))
            } catch (e) {
                console.error("Error parsing compare items", e)
            }
        }
    }, [])

    const removeItem = (id: string) => {
        const newItems = items.filter(i => i.id !== id)
        setItems(newItems)
        localStorage.setItem("bf_compare", JSON.stringify(newItems))
    }

    const clearAll = () => {
        setItems([])
        localStorage.removeItem("bf_compare")
    }

    if (items.length === 0) {
        return (
            <div className="container py-24 text-center">
                <h1 className="text-3xl font-bold mb-4">Compare Products</h1>
                <p className="text-gray-500 mb-8">You haven't added any products to compare.</p>
                <Link href="/products">
                    <Button className="bg-brand-500 hover:bg-brand-600 text-black font-bold">
                        Browse Products
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="container py-12">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Compare Products</h1>
                    <p className="text-gray-500 mt-1">Comparing {items.length} products</p>
                </div>
                <Button variant="ghost" onClick={clearAll} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    Clear All
                </Button>
            </div>

            <div className="overflow-x-auto pb-8">
                <div className="flex gap-6 min-w-max">
                    {items.map((item) => (
                        <div key={item.id} className="w-[300px] border border-gray-200 rounded-lg p-4 relative bg-white">
                            <button
                                onClick={() => removeItem(item.id)}
                                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 z-10"
                                title="Remove from compare"
                            >
                                <Trash2 className="w-4 h-4 text-gray-500" />
                            </button>
                            
                            <Link href={`/products/${item.id}`} className="block group">
                                <div className="relative aspect-[3/4] w-full bg-gray-50 rounded mb-4 overflow-hidden">
                                    {item.image ? (
                                        <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200" />
                                    )}
                                </div>
                                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
                                <p className="text-xl font-bold text-gray-900 mb-4">₹{item.price}</p>
                            </Link>

                            <Link href={`/products/${item.id}`}>
                                <Button className="w-full bg-black hover:bg-gray-800 text-white font-bold">
                                    View Details
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200">
                 <Link href="/products" className="inline-flex items-center text-brand-500 font-bold hover:underline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Shopping
                </Link>
            </div>
        </div>
    )
}
