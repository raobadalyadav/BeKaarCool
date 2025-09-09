"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ShoppingCart, CreditCard, Truck, MapPin, Tag, ArrowLeft, Lock, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAppSelector, useAppDispatch } from "@/store"
import { clearCart, fetchCart, loadFromStorage } from "@/store/slices/cart-slice"
import { usePincode } from "@/hooks/use-pincode"
import { clearStoredCart } from "@/lib/localStorage"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface ShippingAddress {
  name: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
}

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()

  const { items, total, subtotal, shipping, tax, discount, couponCode } = useAppSelector((state) => state.cart)

  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("razorpay")
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  })
  const [couponInput, setCouponInput] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const { fetchPincodeData, loading: pincodeLoading } = usePincode()

  // Use the total from Redux state which already includes all calculations
  const finalTotal = total

  useEffect(() => {
    if (!session) {
      router.push("/auth/login?redirect=/checkout")
      return
    }

    // Load from localStorage first
    dispatch(loadFromStorage())
    
    // Then fetch from server to sync
    dispatch(fetchCart())
  }, [session, dispatch])

  // Separate effect to check if cart is empty after loading
  useEffect(() => {
    if (session && !loading && items.length === 0) {
      // Only redirect if we've finished loading and cart is truly empty
      const timer = setTimeout(() => {
        router.push("/cart")
      }, 1000) // Give some time for data to load
      
      return () => clearTimeout(timer)
    }
  }, [session, loading, items.length, router])

  const handleAddressChange = async (field: keyof ShippingAddress, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }))
    
    // Auto-fetch city and state when pincode is entered
    if (field === 'pincode' && value.length === 6) {
      const pincodeData = await fetchPincodeData(value)
      if (pincodeData) {
        setShippingAddress((prev) => ({
          ...prev,
          city: pincodeData.district,
          state: pincodeData.state
        }))
      }
    }
  }

  const applyCoupon = async () => {
    if (!couponInput.trim()) return

    try {
      const response = await fetch("/api/cart/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput }),
      })

      if (response.ok) {
        const coupon = await response.json()
        setAppliedCoupon(coupon)
        toast({
          title: "Coupon Applied!",
          description: `You saved ₹${coupon.discount}`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Invalid Coupon",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply coupon",
        variant: "destructive",
      })
    }
  }

  const validateForm = () => {
    const required = ["name", "phone", "address", "city", "state", "pincode"]
    for (const field of required) {
      if (!shippingAddress[field as keyof ShippingAddress].trim()) {
        toast({
          title: "Missing Information",
          description: `Please fill in ${field}`,
          variant: "destructive",
        })
        return false
      }
    }
    return true
  }

  const createOrder = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const orderData = {
        items: items.map((item) => ({
          product: item.id,
          quantity: item.quantity,
          price: item.price,
          size: item.size || 'M',
          color: item.color || 'Default',
        })),
        total: finalTotal,
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        discount: discount,
        shippingAddress,
        paymentMethod,
        couponCode: appliedCoupon?.code || couponCode,
      }

      if (paymentMethod === "razorpay") {
        // Create Razorpay order
        const response = await fetch("/api/payments/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: finalTotal }),
        })

        const { orderId, key } = await response.json()

        const options = {
          key,
          amount: finalTotal * 100,
          currency: "INR",
          name: "BeKaarCool",
          description: "Order Payment",
          order_id: orderId,
          handler: async (response: any) => {
            // Verify payment
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                orderData,
              }),
            })

            if (verifyResponse.ok) {
              const result = await verifyResponse.json()
              if (result.verified && result.order) {
                dispatch(clearCart())
                clearStoredCart()
                // Immediate redirect without delay
                window.location.href = `/order-confirmation?orderId=${result.order._id}&success=true`
              } else {
                throw new Error("Payment verification failed")
              }
            } else {
              throw new Error("Payment verification failed")
            }
          },
          prefill: {
            name: shippingAddress.name,
            email: session?.user?.email,
            contact: shippingAddress.phone,
          },
          theme: {
            color: "#3B82F6",
          },
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()
      } else {
        // Cash on Delivery
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        })

        if (response.ok) {
          const order = await response.json()
          dispatch(clearCart())
          clearStoredCart()
          // Immediate redirect without delay
          window.location.href = `/order-confirmation?orderId=${order._id}&success=true`
        } else {
          throw new Error("Failed to create order")
        }
      }
    } catch (error: any) {
      toast({
        title: "Order Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!session || items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={shippingAddress.name}
                      onChange={(e) => handleAddressChange("name", e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={shippingAddress.phone}
                      onChange={(e) => handleAddressChange("phone", e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={shippingAddress.address}
                    onChange={(e) => handleAddressChange("address", e.target.value)}
                    placeholder="Enter your complete address"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <div className="relative">
                      <Input
                        id="pincode"
                        value={shippingAddress.pincode}
                        onChange={(e) => handleAddressChange("pincode", e.target.value)}
                        placeholder="Enter 6-digit pincode"
                        maxLength={6}
                      />
                      {pincodeLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="city">District/City *</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => handleAddressChange("city", e.target.value)}
                      placeholder={pincodeLoading ? "Loading..." : "District/City"}
                      disabled={pincodeLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => handleAddressChange("state", e.target.value)}
                      placeholder={pincodeLoading ? "Loading..." : "State"}
                      disabled={pincodeLoading}
                    />
                  </div>
                </div>
                {shippingAddress.pincode.length === 6 && shippingAddress.city && shippingAddress.state && (
                  <div className="text-xs text-green-600 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Auto-filled from pincode. You can edit these fields if needed.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="razorpay" id="razorpay" />
                    <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Online Payment</p>
                          <p className="text-sm text-gray-600">Pay securely with Razorpay</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">Recommended</Badge>
                          <Lock className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-sm text-gray-600">Pay when you receive your order</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}

                <Separator />

                {/* Coupon */}
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
                    Apply Coupon
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter coupon code"
                    />
                    <Button variant="outline" onClick={applyCoupon}>
                      Apply
                    </Button>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm">Coupon applied: {appliedCoupon.code}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (18% GST)</span>
                    <span>₹{tax.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <Truck className="h-4 w-4 mr-1" />
                      Shipping
                    </span>
                    <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                <Button onClick={createOrder} disabled={loading} className="w-full" size="lg">
                  {loading ? "Processing..." : `Place Order - ₹${finalTotal.toLocaleString()}`}
                </Button>

                <div className="text-xs text-gray-600 text-center">
                  <Lock className="h-3 w-3 inline mr-1" />
                  Your payment information is secure and encrypted
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
