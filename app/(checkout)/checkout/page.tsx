"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CreditCard, Smartphone, Banknote, Shield, Truck, Wallet, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAppSelector, useAppDispatch } from "@/store"
import { clearCart, fetchCart, loadFromStorage } from "@/store/slices/cart-slice"
import Script from "next/script"

declare global {
    interface Window {
        Razorpay: any
    }
}

type PaymentMethod = "razorpay" | "phonepe" | "cod" | "stripe"

export default function CheckoutPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const { toast } = useToast()
    const dispatch = useAppDispatch()

    const { items, total, subtotal, shipping, tax, discount } = useAppSelector((state) => state.cart)

    const [step, setStep] = useState<"ADDRESS" | "PAYMENT">("ADDRESS")
    const [loading, setLoading] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay")
    const [razorpayLoaded, setRazorpayLoaded] = useState(false)

    const [address, setAddress] = useState({
        name: session?.user?.name || "",
        phone: "",
        pincode: "",
        city: "",
        state: "",
        street: "",
        landmark: ""
    })

    // Load cart and user info on mount
    useEffect(() => {
        dispatch(loadFromStorage())
        if (session) {
            dispatch(fetchCart())
            // Pre-fill user name
            if (session.user?.name) {
                setAddress(prev => ({ ...prev, name: session.user.name || "" }))
            }
        }
    }, [session, dispatch])

    // Check serviceability and fetch city/state
    const handlePincodeChange = async (pincode: string) => {
        setAddress(prev => ({ ...prev, pincode }))
        if (pincode.length === 6) {
            try {
                // Check internal serviceability
                const shipRes = await fetch(`/api/shipping?pincode=${pincode}`)
                const shipData = await shipRes.json()

                if (!shipData.serviceable) {
                    toast({
                        title: "Pincode not serviceable",
                        description: "We currently do not deliver to this location.",
                        variant: "destructive"
                    })
                }

                // Fetch details
                const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
                const data = await response.json()
                if (data[0]?.Status === "Success") {
                    const postOffice = data[0].PostOffice[0]
                    setAddress(prev => ({
                        ...prev,
                        city: postOffice.District,
                        state: postOffice.State
                    }))
                }
            } catch (error) {
                console.error("Pincode lookup failed:", error)
            }
        }
    }

    const handleNextStep = () => {
        if (!address.name || !address.phone || !address.pincode || !address.street || !address.city) {
            toast({
                title: "Incomplete Address",
                description: "Please fill all required fields.",
                variant: "destructive"
            })
            return
        }
        if (!/^[6-9]\d{9}$/.test(address.phone)) {
            toast({
                title: "Invalid Phone",
                description: "Please enter a valid 10-digit phone number.",
                variant: "destructive"
            })
            return
        }
        setStep("PAYMENT")
    }

    const handlePlaceOrder = async () => {
        setLoading(true)

        try {
            if (paymentMethod === "cod") {
                await createOrder(null, "cod")
            } else if (paymentMethod === "razorpay") {
                await initiateRazorpayPayment()
            } else if ((paymentMethod as string) === "phonepe") {
                await initiatePhonePePayment()
            } else if ((paymentMethod as string) === "paytm") {
                await initiatePaytmPayment()
            } else if ((paymentMethod as string) === "payu") {
                await initiatePayUPayment()
            } else if ((paymentMethod as string) === "stripe") {
                await initiateStripePayment()
            }
        } catch (error: any) {
            toast({
                title: "Payment Failed",
                description: error.message || "Something went wrong",
                variant: "destructive"
            })
            setLoading(false)
        }
    }

    const initiateRazorpayPayment = async () => {
        // Create order on server
        const response = await fetch("/api/payments/razorpay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: Math.round(total * 100), // Convert to paise
                currency: "INR"
            })
        })

        const data = await response.json()
        if (!data.success) throw new Error(data.error)

        // Open Razorpay checkout
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: Math.round(total * 100),
            currency: "INR",
            name: "BeKaarCool",
            description: "Order Payment",
            order_id: data.orderId,
            handler: async (response: any) => {
                // Verify payment
                const verifyRes = await fetch("/api/payments/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        provider: "razorpay",
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        signature: response.razorpay_signature
                    })
                })

                const verifyData = await verifyRes.json()
                if (verifyData.verified) {
                    await createOrder(response.razorpay_payment_id, "razorpay")
                } else {
                    throw new Error("Payment verification failed")
                }
            },
            prefill: {
                name: address.name,
                email: session?.user?.email || "",
                contact: address.phone
            },
            theme: {
                color: "#FACC15" // Yellow theme
            },
            modal: {
                ondismiss: () => setLoading(false)
            }
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()
    }

    const initiatePhonePePayment = async () => {
        // Create pending order first
        const orderData = await createOrder(null, "phonepe", false)
        if (!orderData) return

        const response = await fetch("/api/payments/phonepe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: Math.round(total * 100),
                orderId: orderData.orderNumber,
                customerPhone: address.phone,
                customerEmail: session?.user?.email
            })
        })

        const data = await response.json()
        if (data.success && data.paymentLink) {
            window.location.href = data.paymentLink
        } else {
            throw new Error(data.error || "PhonePe payment failed")
        }
    }

    const initiatePaytmPayment = async () => {
        const orderData = await createOrder(null, "paytm", false)
        if (!orderData) return

        const response = await fetch("/api/payments/paytm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: Math.round(total * 100),
                orderId: orderData.orderNumber,
                customerPhone: address.phone,
                customerEmail: session?.user?.email
            })
        })

        const data = await response.json()
        if (data.success && data.paymentLink) {
            // For Paytm linkage, usually a form submit or redirect
            window.location.href = data.paymentLink
        } else {
            throw new Error(data.error || "Paytm payment failed")
        }
    }

    const initiatePayUPayment = async () => {
        const orderData = await createOrder(null, "payu", false)
        if (!orderData) return

        const response = await fetch("/api/payments/payu", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: Math.round(total * 100),
                orderId: orderData.orderNumber,
                customerPhone: address.phone,
                customerEmail: session?.user?.email
            })
        })

        const data = await response.json()
        if (data.success && data.paymentLink) {
            window.location.href = data.paymentLink
        } else {
            throw new Error(data.error || "PayU payment failed")
        }
    }

    const initiateStripePayment = async () => {
        const response = await fetch("/api/payments/stripe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: Math.round(total * 100),
                currency: "inr"
            })
        })

        const data = await response.json()
        if (data.clientSecret) {
            // For Stripe, we'd use Stripe Elements - for now redirect
            toast({
                title: "Coming Soon",
                description: "Stripe payment integration is being set up."
            })
            setLoading(false)
        } else {
            throw new Error(data.error)
        }
    }

    const createOrder = async (paymentId: string | null, method: string, redirect: boolean = true) => {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: items.map(item => ({
                    product: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    size: item.size,
                    color: item.color
                })),
                shippingAddress: {
                    name: address.name,
                    phone: address.phone,
                    address: address.street,
                    landmark: address.landmark,
                    city: address.city,
                    state: address.state,
                    pincode: address.pincode,
                    country: "India"
                },
                paymentMethod: method,
                paymentStatus: method === "cod" || method === "razorpay" ? undefined : "pending",
                paymentId,
                subtotal,
                shipping,
                tax,
                discount,
                total
            })
        })

        const data = await response.json()

        if (response.ok) {
            dispatch(clearCart())
            if (redirect) {
                toast({ title: "Order Placed!", description: "Redirecting to confirmation..." })
                router.push(`/order-confirmation?orderNumber=${data.orderNumber}`)
            }
            return data
        } else {
            throw new Error(data.message || "Failed to create order")
        }

        setLoading(false) // Only reached if error thrown above is caught by caller? No, throw stops execution here. 
        // Actually, setLoading(false) is unreachable if error thrown. But caller catches.
    }

    if (items.length === 0 && !loading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Your Bag is Empty</h2>
                <Button onClick={() => router.push("/products")} className="bg-yellow-400 text-black hover:bg-yellow-500">
                    Continue Shopping
                </Button>
            </div>
        )
    }

    return (
        <>
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setRazorpayLoaded(true)}
            />

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Column: Steps */}
                    <div className="flex-1 space-y-6">

                        {/* Step 1: Address */}
                        <div className={`border rounded-lg overflow-hidden bg-white ${step === "ADDRESS" ? "border-gray-300 shadow-sm" : "border-gray-200"}`}>
                            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "ADDRESS" ? "bg-yellow-400 text-black" : "bg-green-500 text-white"}`}>
                                        {step === "ADDRESS" ? "1" : "✓"}
                                    </span>
                                    Delivery Address
                                </h3>
                                {step === "PAYMENT" && (
                                    <Button variant="ghost" size="sm" onClick={() => setStep("ADDRESS")} className="text-yellow-600 font-bold h-8">
                                        CHANGE
                                    </Button>
                                )}
                            </div>

                            {step === "ADDRESS" ? (
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Full Name *</Label>
                                            <Input
                                                value={address.name}
                                                onChange={(e) => setAddress({ ...address, name: e.target.value })}
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone Number *</Label>
                                            <Input
                                                value={address.phone}
                                                onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                                                placeholder="10-digit mobile number"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Pincode *</Label>
                                            <Input
                                                value={address.pincode}
                                                onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                placeholder="6-digit pincode"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>City *</Label>
                                            <Input
                                                value={address.city}
                                                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                                placeholder="City"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>State</Label>
                                            <Input
                                                value={address.state}
                                                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                                placeholder="State"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Street Address *</Label>
                                        <Input
                                            value={address.street}
                                            onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                            placeholder="House No, Building, Street, Area"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Landmark (Optional)</Label>
                                        <Input
                                            value={address.landmark}
                                            onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                                            placeholder="Near landmark"
                                        />
                                    </div>

                                    <Button
                                        className="w-full md:w-auto bg-yellow-400 hover:bg-yellow-500 text-black font-bold mt-4"
                                        onClick={handleNextStep}
                                    >
                                        SAVE & CONTINUE
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-6 text-sm text-gray-600">
                                    <p className="font-bold text-gray-900">{address.name}</p>
                                    <p>{address.street}{address.landmark && `, ${address.landmark}`}</p>
                                    <p>{address.city}, {address.state} - {address.pincode}</p>
                                    <p>Phone: {address.phone}</p>
                                </div>
                            )}
                        </div>

                        {/* Step 2: Payment */}
                        <div className={`border rounded-lg overflow-hidden bg-white ${step === "PAYMENT" ? "border-gray-300 shadow-sm" : "border-gray-200 opacity-60"}`}>
                            <div className="bg-gray-50 px-6 py-4 border-b">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "PAYMENT" ? "bg-yellow-400 text-black" : "bg-gray-400 text-white"}`}>
                                        2
                                    </span>
                                    Payment Method
                                </h3>
                            </div>

                            {step === "PAYMENT" && (
                                <div className="p-6">
                                    <RadioGroup
                                        value={paymentMethod}
                                        onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                                        className="space-y-3"
                                    >
                                        <label className={`flex items-center space-x-3 border p-4 rounded cursor-pointer transition-colors ${paymentMethod === "razorpay" ? "border-yellow-400 bg-yellow-50" : "hover:border-gray-400"}`}>
                                            <RadioGroupItem value="razorpay" id="razorpay" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Smartphone className="h-5 w-5 text-blue-600" />
                                                    <span className="font-medium">UPI / Cards / Net Banking</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Pay with GPay, PhonePe, Credit/Debit Card, Net Banking</p>
                                            </div>
                                        </label>

                                        <label className={`flex items-center space-x-3 border p-4 rounded cursor-pointer transition-colors ${(paymentMethod as string) === "phonepe" ? "border-yellow-400 bg-yellow-50" : "hover:border-gray-400"}`}>
                                            <RadioGroupItem value="phonepe" id="phonepe" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Smartphone className="h-5 w-5 text-purple-600" />
                                                    <span className="font-medium">PhonePe</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">UPI, Wallet, Card</p>
                                            </div>
                                        </label>

                                        <label className={`flex items-center space-x-3 border p-4 rounded cursor-pointer transition-colors ${(paymentMethod as string) === "paytm" ? "border-yellow-400 bg-yellow-50" : "hover:border-gray-400"}`}>
                                            <RadioGroupItem value="paytm" id="paytm" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Wallet className="h-5 w-5 text-blue-400" />
                                                    <span className="font-medium">Paytm</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Wallet, UPI, NetBanking</p>
                                            </div>
                                        </label>

                                        <label className={`flex items-center space-x-3 border p-4 rounded cursor-pointer transition-colors ${(paymentMethod as string) === "payu" ? "border-yellow-400 bg-yellow-50" : "hover:border-gray-400"}`}>
                                            <RadioGroupItem value="payu" id="payu" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="h-5 w-5 text-green-600" />
                                                    <span className="font-medium">PayU / Cards</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Credit/Debit Card, NetBanking</p>
                                            </div>
                                        </label>

                                        <label className={`flex items-center space-x-3 border p-4 rounded cursor-pointer transition-colors ${paymentMethod === "cod" ? "border-yellow-400 bg-yellow-50" : "hover:border-gray-400"}`}>
                                            <RadioGroupItem value="cod" id="cod" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Banknote className="h-5 w-5 text-green-600" />
                                                    <span className="font-medium">Cash On Delivery</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Pay when you receive your order</p>
                                            </div>
                                        </label>
                                    </RadioGroup>

                                    <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                                        <Shield className="h-4 w-4" />
                                        <span>100% Secure Payments | SSL Encrypted</span>
                                    </div>

                                    <Button
                                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-12 mt-6"
                                        onClick={handlePlaceOrder}
                                        disabled={loading || (!razorpayLoaded && paymentMethod === "razorpay")}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : paymentMethod === "cod" ? (
                                            `PLACE ORDER • ₹${total.toLocaleString()}`
                                        ) : (
                                            `PAY ₹${total.toLocaleString()}`
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Column: Summary */}
                    <div className="w-full lg:w-[340px]">
                        <div className="border rounded-lg bg-white p-5 sticky top-24">
                            <h4 className="text-gray-500 text-xs font-bold uppercase mb-4">Order Summary ({items.length} items)</h4>

                            {/* Items Preview */}
                            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                                {items.slice(0, 3).map((item, idx) => (
                                    <div key={idx} className="flex gap-3 text-sm">
                                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                            {item.image && (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate font-medium">{item.name}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity} | {item.size}</p>
                                        </div>
                                        <p className="font-medium">₹{item.price * item.quantity}</p>
                                    </div>
                                ))}
                                {items.length > 3 && (
                                    <p className="text-xs text-gray-500">+{items.length - 3} more items</p>
                                )}
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span>₹{subtotal.toLocaleString()}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-₹{discount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className={shipping === 0 ? "text-green-600" : ""}>
                                        {shipping === 0 ? "FREE" : `₹${shipping}`}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-base">
                                    <span>Total</span>
                                    <span>₹{total.toLocaleString()}</span>
                                </div>
                            </div>

                            {shipping === 0 && (
                                <div className="mt-4 bg-green-50 text-green-700 text-xs font-medium px-3 py-2 rounded flex items-center gap-2">
                                    <Truck className="h-4 w-4" />
                                    Yay! You get FREE shipping on this order
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}
