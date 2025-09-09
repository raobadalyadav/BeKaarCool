"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Truck, CheckCircle, Clock, MapPin, CreditCard, Download, ArrowLeft, Phone, Mail, X, AlertTriangle, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface OrderDetails {
  _id: string
  orderNumber: string
  items: Array<{
    product: {
      _id: string
      name: string
      images: string[]
    }
    quantity: number
    price: number
    size: string
    color: string
    customization?: {
      text?: string
      design?: string
    }
  }>
  shippingAddress: {
    name: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
    country: string
  }
  paymentMethod: string
  paymentStatus: string
  paymentId?: string
  total?: number
  totalAmount?: number
  subtotal: number
  shipping: number
  tax: number
  discount: number
  couponCode?: string
  status: string
  trackingNumber?: string
  estimatedDelivery?: string
  deliveredAt?: string
  createdAt: string
  updatedAt: string
}

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export default function OrderDetailsPage({ params }: OrderPageProps) {
  const { data: session } = useSession()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [orderId, setOrderId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const [trackingData, setTrackingData] = useState<any>(null)
  const [showTracking, setShowTracking] = useState(false)

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params
      // Validate that the ID is not undefined or invalid
      if (!id || id === 'undefined' || id === 'null') {
        setError("Invalid order ID")
        setLoading(false)
        return
      }
      setOrderId(id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (session && orderId) {
      fetchOrderDetails()
    }
  }, [session, orderId])

  const fetchOrderDetails = async () => {
    if (!orderId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`)

      if (!response.ok) {
        throw new Error("Order not found")
      }

      const data = await response.json()
      setOrder(data)
    } catch (error: any) {
      setError(error.message || "Failed to fetch order details")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-purple-100 text-purple-800"
      case "shipped":
        return "bg-indigo-100 text-indigo-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getOrderTimeline = () => {
    if (!order) return []

    const timeline = [
      {
        status: "Order Placed",
        date: order.createdAt,
        completed: true,
        icon: <Package className="h-4 w-4" />,
      },
      {
        status: "Order Confirmed",
        date: order.status !== "pending" ? order.updatedAt : null,
        completed: order.status !== "pending",
        icon: <CheckCircle className="h-4 w-4" />,
      },
      {
        status: "Processing",
        date: ["processing", "shipped", "delivered"].includes(order.status) ? order.updatedAt : null,
        completed: ["processing", "shipped", "delivered"].includes(order.status),
        icon: <Clock className="h-4 w-4" />,
      },
      {
        status: "Shipped",
        date: ["shipped", "delivered"].includes(order.status) ? order.updatedAt : null,
        completed: ["shipped", "delivered"].includes(order.status),
        icon: <Truck className="h-4 w-4" />,
      },
      {
        status: "Delivered",
        date: order.deliveredAt,
        completed: order.status === "delivered",
        icon: <CheckCircle className="h-4 w-4" />,
      },
    ]

    return timeline
  }

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation")
      return
    }

    setCancelling(true)
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      })

      if (response.ok) {
        toast.success("Order cancelled successfully")
        fetchOrderDetails()
        setCancelReason("")
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to cancel order")
      }
    } catch (error) {
      toast.error("Failed to cancel order")
    } finally {
      setCancelling(false)
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`)
      if (response.ok) {
        const invoice = await response.json()
        
        // Generate styled HTML invoice
        const { generateStyledInvoiceHTML } = await import('@/lib/pdf-invoice')
        const htmlContent = generateStyledInvoiceHTML(invoice)
        
        // Create and download HTML file
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoice.orderNumber}.html`
        a.click()
        URL.revokeObjectURL(url)
        
        // Open in new window for printing
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(htmlContent)
          printWindow.document.close()
          setTimeout(() => {
            printWindow.print()
          }, 500)
        }
        
        toast.success("Invoice ready for download and printing")
      } else {
        toast.error("Failed to generate invoice")
      }
    } catch (error) {
      toast.error("Failed to download invoice")
    }
  }

  const handleTrackOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/track`)
      if (response.ok) {
        const data = await response.json()
        setTrackingData(data)
        setShowTracking(true)
      } else {
        toast.error("No tracking information available")
      }
    } catch (error) {
      toast.error("Failed to fetch tracking information")
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Please log in to view order details.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error || "Order not found"}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/orders">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/orders">
          <Button variant="outline" className="mb-4 bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-gray-600">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className={getStatusColor(order.status)}>
              <span className="capitalize">{order.status}</span>
            </Badge>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleDownloadInvoice}>
                <Download className="mr-2 h-4 w-4" />
                Download Invoice
              </Button>
              {["pending", "confirmed"].includes(order.status) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      <X className="mr-2 h-4 w-4" />
                      Cancel Order
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                        <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
                        Cancel Order
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this order? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-4">
                      <label className="text-sm font-medium">Reason for cancellation:</label>
                      <Textarea
                        placeholder="Please provide a reason for cancelling this order..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setCancelReason("")}>
                        Keep Order
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelOrder}
                        disabled={cancelling || !cancelReason.trim()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {cancelling ? "Cancelling..." : "Cancel Order"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getOrderTimeline().map((step, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div
                      className={`p-2 rounded-full ${step.completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                    >
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${step.completed ? "text-gray-900" : "text-gray-500"}`}>
                        {step.status}
                      </p>
                      {step.date && <p className="text-sm text-gray-500">{formatDate(step.date)}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {order.trackingNumber && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">Tracking Number</p>
                      <p className="text-blue-700">{order.trackingNumber}</p>
                    </div>
                    <Dialog open={showTracking} onOpenChange={setShowTracking}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={handleTrackOrder}>
                          <Truck className="mr-2 h-4 w-4" />
                          Track Package
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Order Tracking</DialogTitle>
                          <DialogDescription>
                            Track your order #{order.orderNumber}
                          </DialogDescription>
                        </DialogHeader>
                        {trackingData && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                              <div>
                                <p className="font-medium">Tracking Number</p>
                                <p className="text-blue-700">{trackingData.trackingNumber}</p>
                              </div>
                              <Badge className={getStatusColor(trackingData.status)}>
                                {trackingData.status}
                              </Badge>
                            </div>
                            <div className="space-y-3">
                              <h4 className="font-medium">Tracking Timeline</h4>
                              {trackingData.timeline.map((event: any, index: number) => (
                                <div key={index} className="flex items-start space-x-3 pb-3">
                                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                  <div className="flex-1">
                                    <p className="font-medium">{event.status}</p>
                                    <p className="text-sm text-gray-600">{event.description}</p>
                                    <p className="text-xs text-gray-500">
                                      {formatDate(event.date)} • {event.location}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="relative h-20 w-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={item.product?.images?.[0] || "/placeholder.svg"}
                        alt={item.product?.name || "Product image"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.product?.name || "Product"}</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.size && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            Size: {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            {item.color}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          Qty: {item.quantity}
                        </span>
                      </div>
                      {item.customization && (
                        <div className="mt-3 p-2 bg-blue-50 rounded-md">
                          <p className="text-sm font-medium text-blue-900 mb-1">Customization:</p>
                          {item.customization.text && (
                            <p className="text-sm text-blue-700">Text: "{item.customization.text}"</p>
                          )}
                          {item.customization.design && (
                            <p className="text-sm text-blue-700">Custom Design Applied</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-lg text-gray-900">₹{Math.round(item.price)}</p>
                      <p className="text-sm text-gray-500">₹{Math.round(item.price / item.quantity)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{Math.round(order.subtotal)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">{order.shipping > 0 ? `₹${Math.round(order.shipping)}` : 'Free'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">₹{Math.round(order.tax)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between py-1 text-green-600">
                    <span>Discount {order.couponCode && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 ml-1">
                        {order.couponCode}
                      </span>
                    )}</span>
                    <span className="font-medium">-₹{Math.round(order.discount)}</span>
                  </div>
                )}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between font-bold text-xl py-2">
                <span>Total</span>
                <span className="text-blue-600">₹{Math.round(order.total || order.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium capitalize">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                <Badge
                  className={
                    order.paymentStatus === "completed" || order.paymentStatus === "paid"
                      ? "bg-green-100 text-green-800"
                      : order.paymentStatus === "failed"
                      ? "bg-red-100 text-red-800"
                      : order.paymentStatus === "refunded"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  <span className="capitalize">{order.paymentStatus}</span>
                </Badge>
              </div>
              {order.paymentId && (
                <div>
                  <p className="text-sm text-gray-600">Transaction ID</p>
                  <p className="font-mono text-sm">{order.paymentId}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p className="text-sm text-gray-600">{order.shippingAddress.address}</p>
                <p className="text-sm text-gray-600">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                </p>
                <p className="text-sm text-gray-600">{order.shippingAddress.country}</p>
                <div className="pt-2 space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="mr-2 h-4 w-4" />
                    {order.shippingAddress.phone}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Have questions about your order? Our support team is here to help.
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
