"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Truck, MapPin, CreditCard, Lock, ChevronRight, Edit2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAppSelector, useAppDispatch } from "@/store"
import { clearCart, fetchCart, loadFromStorage } from "@/store/slices/cart-slice"

export default function CheckoutPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const { toast } = useToast()
    const dispatch = useAppDispatch()

    const { items, total, subtotal, shipping, tax, discount } = useAppSelector((state) => state.cart)

    const [step, setStep] = useState<"ADDRESS" | "PAYMENT">("ADDRESS")
    const [loading, setLoading] = useState(false)

    const [address, setAddress] = useState({
        name: "",
        phone: "",
        pincode: "",
        city: "",
        state: "",
        street: ""
    })

    // Load cart on mount
    useEffect(() => {
        dispatch(loadFromStorage())
        if (session) dispatch(fetchCart())
    }, [session, dispatch])

    const handleNextStep = () => {
        // Basic validation
        if (!address.name || !address.phone || !address.pincode || !address.street) {
            toast({ title: "Incomplete Address", description: "Please fill all required fields.", variant: "destructive" })
            return
        }
        setStep("PAYMENT")
    }

    const handlePlaceOrder = async () => {
        setLoading(true)
        // Simulate API Call
        await new Promise(resolve => setTimeout(resolve, 2000))

        dispatch(clearCart())
        toast({ title: "Order Placed!", description: "Redirecting to confirmation..." })
        router.push("/order-confirmation?success=true")
        setLoading(false)
    }

    if (items.length === 0 && !loading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Your Bag is Empty</h2>
                <Button onClick={() => router.push("/")} className="bg-yellow-400 text-black">Continue Shopping</Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* Left Column: Steps */}
                <div className="flex-1 space-y-6">

                    {/* Step 1: Address */}
                    <div className={`border rounded-lg overflow-hidden bg-white ${step === "ADDRESS" ? "border-gray-300 shadow-sm" : "border-transparent"}`}>
                        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs">1</span>
                                Delivery Address
                            </h3>
                            {step === "PAYMENT" && (
                                <Button variant="ghost" size="sm" onClick={() => setStep("ADDRESS")} className="text-teal-600 font-bold h-8">
                                    EDIT
                                </Button>
                            )}
                        </div>

                        {step === "ADDRESS" ? (
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} placeholder="Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone Number</Label>
                                        <Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="10-digit Mobile number" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Pincode</Label>
                                        <Input value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} placeholder="Pincode" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="City" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Flat Info / Street Address</Label>
                                    <Input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} placeholder="Address (House No, Building, Street, Area)" />
                                </div>

                                <Button className="w-full md:w-auto bg-yellow-400 hover:bg-yellow-500 text-black font-bold mt-4" onClick={handleNextStep}>
                                    SAVE & CONTINUE
                                </Button>
                            </div>
                        ) : (
                            <div className="p-6 text-sm text-gray-600">
                                <p className="font-bold text-gray-900">{address.name}</p>
                                <p>{address.street}, {address.city} - {address.pincode}</p>
                                <p>{address.phone}</p>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Payment */}
                    <div className={`border rounded-lg overflow-hidden bg-white ${step === "PAYMENT" ? "border-gray-300 shadow-sm" : "border-transparent opacity-60"}`}>
                        <div className="bg-gray-50 px-6 py-4 border-b">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs">2</span>
                                Payment Method
                            </h3>
                        </div>
                        {step === "PAYMENT" && (
                            <div className="p-6">
                                <RadioGroup defaultValue="upi" className="space-y-3">
                                    <div className="flex items-center space-x-2 border p-4 rounded cursor-pointer hover:border-black transition-colors">
                                        <RadioGroupItem value="upi" id="upi" />
                                        <Label htmlFor="upi" className="flex-1 cursor-pointer font-medium">UPI (GPay, PhonePe)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border p-4 rounded cursor-pointer hover:border-black transition-colors">
                                        <RadioGroupItem value="card" id="card" />
                                        <Label htmlFor="card" className="flex-1 cursor-pointer font-medium">Credit / Debit Card</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border p-4 rounded cursor-pointer hover:border-black transition-colors">
                                        <RadioGroupItem value="cod" id="cod" />
                                        <Label htmlFor="cod" className="flex-1 cursor-pointer font-medium">Cash On Delivery</Label>
                                    </div>
                                </RadioGroup>

                                <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-12 mt-6" onClick={handlePlaceOrder} disabled={loading}>
                                    {loading ? "Processing..." : `PAY ₹${total}`}
                                </Button>
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Column: Summary */}
                <div className="w-full lg:w-[320px]">
                    <div className="border rounded-lg bg-white p-4 sticky top-24">
                        <h4 className="text-gray-500 text-xs font-bold uppercase mb-4">Price Summary</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total MRP (Incl. of taxes)</span>
                                <span>₹{items.reduce((sum, i) => sum + (i.originalPrice || i.price) * i.quantity, 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping Charges</span>
                                <span className="text-green-600">{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Bag Discount</span>
                                <span className="text-gray-900">- ₹{(items.reduce((sum, i) => sum + (i.originalPrice || i.price) * i.quantity, 0) - subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span>₹{subtotal}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-base">
                                <span>Final Amount</span>
                                <span>₹{total}</span>
                            </div>
                        </div>

                        <div className="mt-4 bg-green-50 text-green-700 text-[10px] font-bold px-3 py-2 rounded text-center">
                            You are saving ₹{(items.reduce((sum, i) => sum + (i.originalPrice || i.price) * i.quantity, 0) - subtotal)} on this order
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
