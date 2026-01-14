"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, Search, MapPin, Clock, CheckCircle, Home, AlertCircle, Phone, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TrackingInfo {
  orderNumber: string
  status: string
  estimatedDelivery: string
  currentLocation: string
  trackingNumber: string
  carrier: string
  timeline: Array<{
    status: string
    description: string
    location: string
    timestamp: string
    completed: boolean
  }>
  orderDetails: {
    items: Array<{
      name: string
      quantity: number
      image: string
    }>
    total: number
    shippingAddress: {
      name: string
      address: string
      city: string
      state: string
      pincode: string
    }
  }
}

export default function TrackOrderPage() {
  const [trackingInput, setTrackingInput] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleTrackOrder = async () => {
    if (!trackingInput.trim()) {
      setError("Please enter an order number or tracking ID")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Try to find order by order number first
      const response = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(trackingInput.trim())}`)

      if (!response.ok) {
        throw new Error("Order not found")
      }

      const data = await response.json()

      if (!data.order) {
        throw new Error("Order not found")
      }

      // Map API response to tracking info format
      const order = data.order
      const trackingData: TrackingInfo = {
        orderNumber: order.orderNumber,
        status: order.status,
        estimatedDelivery: order.estimatedDelivery
          ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
          })
          : "3-5 business days",
        currentLocation: order.tracking?.currentLocation || "Processing Center",
        trackingNumber: order.tracking?.trackingNumber || order.orderNumber,
        carrier: order.tracking?.carrier || "BeKaarCool Logistics",
        timeline: order.statusHistory?.map((event: any) => ({
          status: event.status,
          description: getStatusDescription(event.status),
          location: event.location || "BeKaarCool",
          timestamp: new Date(event.timestamp).toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          }),
          completed: true
        })) || [],
        orderDetails: {
          items: order.items?.map((item: any) => ({
            name: item.product?.name || item.name || "Product",
            quantity: item.quantity,
            image: item.product?.images?.[0] || "/placeholder.svg"
          })) || [],
          total: order.total || order.totalAmount || 0,
          shippingAddress: order.shippingAddress || {
            name: "Customer",
            address: "",
            city: "",
            state: "",
            pincode: ""
          }
        }
      }

      // Add pending statuses to timeline
      const allStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered']
      const currentIndex = allStatuses.indexOf(order.status.toLowerCase().replace(' ', '_'))

      allStatuses.forEach((status, index) => {
        if (index > currentIndex) {
          trackingData.timeline.push({
            status: formatStatusName(status),
            description: getStatusDescription(status),
            location: "Pending",
            timestamp: "Expected",
            completed: false
          })
        }
      })

      setTrackingInfo(trackingData)
      toast({
        title: "Order Found!",
        description: "Your order tracking information has been loaded.",
      })
    } catch (error) {
      setError("Order not found. Please check your order number and try again.")
      toast({
        title: "Order Not Found",
        description: "Please verify your order number or tracking ID.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusDescription = (status: string) => {
    const descriptions: Record<string, string> = {
      'pending': 'Your order has been placed and is awaiting confirmation',
      'confirmed': 'Your order has been confirmed and is being prepared',
      'processing': 'Your order is being packed and prepared for shipment',
      'shipped': 'Your order has been shipped and is on its way',
      'out_for_delivery': 'Your package is out for delivery today',
      'delivered': 'Your package has been successfully delivered'
    }
    return descriptions[status.toLowerCase().replace(' ', '_')] || 'Status update'
  }

  const formatStatusName = (status: string) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "out for delivery":
        return "bg-blue-100 text-blue-800"
      case "in transit":
        return "bg-yellow-100 text-yellow-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-xl text-gray-600">
            Enter your order number or tracking ID to get real-time updates on your shipment.
          </p>
        </div>

        {/* Tracking Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Track Your Package
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tracking">Order Number / Tracking ID *</Label>
                  <Input
                    id="tracking"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Enter order number (e.g., DR123456789)"
                    className={error ? "border-red-300" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
              {error && (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}
              <Button onClick={handleTrackOrder} disabled={loading} className="w-full md:w-auto">
                {loading ? "Tracking..." : "Track Order"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Results */}
        {trackingInfo && (
          <div className="space-y-6">
            {/* Order Status Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order Status</CardTitle>
                  <Badge className={getStatusColor(trackingInfo.status)}>{trackingInfo.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="font-semibold">{trackingInfo.orderNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estimated Delivery</p>
                      <p className="font-semibold">{trackingInfo.estimatedDelivery}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Current Location</p>
                      <p className="font-semibold">{trackingInfo.currentLocation}</p>
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Tracking Number: {trackingInfo.trackingNumber}</span>
                  <span>Carrier: {trackingInfo.carrier}</span>
                </div>
              </CardContent>
            </Card>

            {/* Tracking Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Tracking Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {trackingInfo.timeline.map((event, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${event.completed
                              ? "bg-green-100 border-2 border-green-500"
                              : "bg-gray-100 border-2 border-gray-300"
                            }`}
                        >
                          {event.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-semibold ${event.completed ? "text-gray-900" : "text-gray-500"}`}>
                            {event.status}
                          </h3>
                          <span className={`text-sm ${event.completed ? "text-gray-600" : "text-gray-400"}`}>
                            {event.timestamp}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${event.completed ? "text-gray-600" : "text-gray-400"}`}>
                          {event.description}
                        </p>
                        <p
                          className={`text-xs mt-1 flex items-center ${event.completed ? "text-gray-500" : "text-gray-400"
                            }`}
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          {event.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trackingInfo.orderDetails.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>₹{trackingInfo.orderDetails.total.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Home className="h-5 w-5 mr-2" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">{trackingInfo.orderDetails.shippingAddress.name}</p>
                    <p>{trackingInfo.orderDetails.shippingAddress.address}</p>
                    <p>
                      {trackingInfo.orderDetails.shippingAddress.city},{" "}
                      {trackingInfo.orderDetails.shippingAddress.state}{" "}
                      {trackingInfo.orderDetails.shippingAddress.pincode}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Support */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                  <p className="text-gray-600 mb-4">
                    If you have any questions about your order, our support team is here to help.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="outline" className="flex items-center bg-transparent">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Support
                    </Button>
                    <Button variant="outline" className="flex items-center bg-transparent">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Section */}
        {!trackingInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Need Help Finding Your Order?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Where to find your order number:</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Check your order confirmation email</li>
                    <li>• Look in your account under "My Orders"</li>
                    <li>• Find it on your receipt or invoice</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Order number format:</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Usually starts with "DR" followed by numbers</li>
                    <li>• Example: DR123456789</li>
                    <li>• Case insensitive</li>
                  </ul>
                </div>
                <Separator />
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">Still can't find your order? Contact our support team.</p>
                  <Button variant="outline">Contact Support</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
