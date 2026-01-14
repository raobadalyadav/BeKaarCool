"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAppSelector, useAppDispatch } from "@/store"
import { removeFromCart, updateCartItem } from "@/store/slices/cart-slice"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShoppingBag, Trash2, Plus, Minus, X, Truck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function CartSheet({ children }: { children: React.ReactNode }) {
    const dispatch = useAppDispatch()
    const { items, subtotal } = useAppSelector((state) => state.cart)
    const { toast } = useToast()
    const [isOpen, setIsOpen] = useState(false)

    // Free shipping threshold (e.g., ₹999)
    const freeShippingThreshold = 999
    const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal)
    const progressPercentage = Math.min(100, (subtotal / freeShippingThreshold) * 100)

    const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return
        dispatch(updateCartItem({ itemId, quantity: newQuantity }))
    }

    const handleRemoveItem = (itemId: string, name: string) => {
        dispatch(removeFromCart(itemId))
        toast({
            title: "Removed from bag",
            description: `${name} has been removed.`,
        })
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] flex flex-col p-0">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                        <ShoppingBag className="w-5 h-5" />
                        My Bag ({items.length} Items)
                    </SheetTitle>
                </SheetHeader>

                {/* Free Shipping Progress */}
                {items.length > 0 && (
                    <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-100">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 mb-2">
                            <Truck className="w-4 h-4" />
                            {amountToFreeShipping > 0
                                ? <span>Add <span className="text-red-500">₹{amountToFreeShipping}</span> for <span className="text-green-600 uppercase">Free Shipping</span></span>
                                : <span className="text-green-600">Yay! You get FREE Shipping on this order.</span>
                            }
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-yellow-400 transition-all duration-300 rounded-full"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                )}

                <ScrollArea className="flex-1 px-6">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                <ShoppingBag className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Your Bag is Empty</h3>
                            <p className="text-sm text-gray-500 max-w-[200px]">Looks like you haven't added anything to your bag yet.</p>
                            <Button
                                onClick={() => setIsOpen(false)}
                                className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold uppercase tracking-wide"
                            >
                                Start Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 py-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="relative w-20 h-24 flex-shrink-0 bg-gray-50 rounded border overflow-hidden">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">Size: {item.size} | Color: {item.color}</p>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center border rounded-sm h-7">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                    className="w-7 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-8 flex items-center justify-center text-xs font-semibold">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                    className="w-7 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-gray-900">₹{item.price * item.quantity}</span>
                                                {item.originalPrice && (
                                                    <span className="block text-[10px] text-gray-400 line-through">₹{item.originalPrice * item.quantity}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(item.id, item.name)}
                                        className="text-gray-400 hover:text-red-500 self-start p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {items.length > 0 && (
                    <div className="border-t p-6 space-y-4 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>₹{subtotal}</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-600 font-medium">
                                <span>Shipping</span>
                                <span>{amountToFreeShipping === 0 ? "FREE" : "Calculated at checkout"}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between text-base font-bold text-gray-900">
                                <span>Total</span>
                                <span>₹{subtotal}</span>
                            </div>
                        </div>

                        <Link href="/checkout" onClick={() => setIsOpen(false)}>
                            <Button className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-black font-bold uppercase tracking-wider text-sm shadow-sm">
                                Proceed to Checkout
                            </Button>
                        </Link>
                        <div className="text-center">
                            <Link href="/cart" onClick={() => setIsOpen(false)} className="text-xs font-semibold text-gray-500 hover:underline">
                                View Cart Page
                            </Link>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
