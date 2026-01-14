"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Package, Truck, CheckCircle, XCircle, RotateCcw, FileText,
    ChevronRight, MapPin, CreditCard, Clock, Phone
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OrderItem {
    product: {
        _id: string
        name: string
        slug: string
        images: string[]
        price: number
    } | null
    quantity: number
    price: number
    size?: string
    color?: string
}

interface Order {
    _id: string
    orderNumber: string
    status: string
    paymentStatus: string
    paymentMethod: string
    total: number
    subtotal: number
    shipping: number
    tax: number
    discount: number
    items: OrderItem[]
    shippingAddress: {
        name: string
        phone: string
        addressLine1?: string
        address?: string
        city: string
        state: string
        pincode: string
    }
    trackingNumber?: string
    createdAt: string
    updatedAt: string
    shipment?: {
        awbNumber: string
        provider: string
        status: string
        trackingUrl?: string
    }
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    pending: { color: "bg-yellow-100 text-yellow-700", icon: Clock, label: "Pending" },
    confirmed: { color: "bg-blue-100 text-blue-700", icon: CheckCircle, label: "Confirmed" },
    processing: { color: "bg-purple-100 text-purple-700", icon: Package, label: "Processing" },
    shipped: { color: "bg-indigo-100 text-indigo-700", icon: Truck, label: "Shipped" },
    delivered: { color: "bg-green-100 text-green-700", icon: CheckCircle, label: "Delivered" },
    cancelled: { color: "bg-red-100 text-red-700", icon: XCircle, label: "Cancelled" },
    refunded: { color: "bg-gray-100 text-gray-700", icon: RotateCcw, label: "Refunded" }
}

const timelineSteps = ["confirmed", "processing", "shipped", "delivered"]

export default function OrderDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState(false)

    useEffect(() => {
        fetchOrder()
    }, [params.id])

    const fetchOrder = async () => {
        try {
            const res = await fetch(`/api/orders/${params.id}`)
            if (res.ok) {
                const data = await res.json()
                setOrder(data.order || data)
            } else {
                throw new Error("Order not found")
            }
        } catch (error) {
            console.error("Failed to fetch order:", error)
            toast({ title: "Order not found", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handleCancelOrder = async () => {
        if (!confirm("Are you sure you want to cancel this order?")) return

        setCancelling(true)
        try {
            const res = await fetch(`/api/orders/${params.id}/cancel`, {
                method: "POST"
            })
            if (res.ok) {
                toast({ title: "Order cancelled successfully" })
                fetchOrder()
            } else {
                const data = await res.json()
                throw new Error(data.message || "Failed to cancel order")
            }
        } catch (error: any) {
            toast({ title: error.message, variant: "destructive" })
        } finally {
            setCancelling(false)
        }
    }

    const handleDownloadInvoice = async () => {
        try {
            const res = await fetch(`/api/orders/${params.id}/invoice`)
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `invoice-${order?.orderNumber}.pdf`
                a.click()
                window.URL.revokeObjectURL(url)
            } else {
                toast({ title: "Failed to download invoice", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Failed to download invoice", variant: "destructive" })
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const canCancel = order && ["pending", "confirmed"].includes(order.status)
    const canReturn = order && order.status === "delivered"

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!order) {
        return (
            <Alert variant="destructive">
                <AlertDescription>Order not found. Please check the order ID and try again.</AlertDescription>
            </Alert>
        )
    }

    const statusInfo = statusConfig[order.status] || statusConfig.pending
    const StatusIcon = statusInfo.icon
    const currentStepIndex = timelineSteps.indexOf(order.status)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                    <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <Badge className={`${statusInfo.color} text-sm px-3 py-1`}>
                    <StatusIcon className="w-4 h-4 mr-1" />
                    {statusInfo.label}
                </Badge>
            </div>

            {/* Order Timeline */}
            {order.status !== "cancelled" && order.status !== "refunded" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Order Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between relative">
                            {/* Progress Line */}
                            <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 -z-10">
                                <div
                                    className="h-full bg-yellow-400 transition-all"
                                    style={{ width: `${Math.max(0, currentStepIndex) / (timelineSteps.length - 1) * 100}%` }}
                                />
                            </div>

                            {timelineSteps.map((step, idx) => {
                                const isCompleted = idx <= currentStepIndex
                                const isCurrent = idx === currentStepIndex
                                return (
                                    <div key={step} className="flex flex-col items-center">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isCompleted
                                                    ? "bg-yellow-400 text-black"
                                                    : "bg-gray-200 text-gray-500"
                                                } ${isCurrent ? "ring-4 ring-yellow-100" : ""}`}
                                        >
                                            {isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                                        </div>
                                        <span className={`text-xs mt-2 capitalize ${isCompleted ? "font-semibold" : "text-gray-500"}`}>
                                            {step}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        {order.shipment?.awbNumber && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Tracking Number</p>
                                        <p className="font-mono font-semibold">{order.shipment.awbNumber}</p>
                                    </div>
                                    {order.shipment.trackingUrl && (
                                        <a
                                            href={order.shipment.trackingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-yellow-600 font-semibold text-sm hover:underline"
                                        >
                                            Track Package →
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Order Items */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Order Items ({order.items.length})</CardTitle>
                </CardHeader>
                <CardContent className="divide-y">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                            <div className="w-20 h-24 relative bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                {item.product?.images?.[0] ? (
                                    <Image
                                        src={item.product.images[0]}
                                        alt={item.product.name || "Product"}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                {item.product ? (
                                    <Link href={`/products/${item.product.slug}`} className="font-semibold hover:text-yellow-600">
                                        {item.product.name}
                                    </Link>
                                ) : (
                                    <p className="font-semibold text-gray-500">Product unavailable</p>
                                )}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                                    {item.size && <span>Size: {item.size}</span>}
                                    {item.color && <span>Color: {item.color}</span>}
                                    <span>Qty: {item.quantity}</span>
                                </div>
                                <p className="font-bold mt-2">₹{item.price.toLocaleString("en-IN")}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Price Breakdown & Address */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Price Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard className="w-5 h-5" /> Payment Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span>₹{order.subtotal?.toLocaleString("en-IN") || order.total}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Shipping</span>
                            <span>{order.shipping === 0 ? "FREE" : `₹${order.shipping}`}</span>
                        </div>
                        {order.tax > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tax</span>
                                <span>₹{order.tax}</span>
                            </div>
                        )}
                        {order.discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Discount</span>
                                <span>-₹{order.discount}</span>
                            </div>
                        )}
                        <div className="border-t pt-3 flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>₹{order.total.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                            Paid via {order.paymentMethod?.toUpperCase() || "Online"}
                        </div>
                    </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="w-5 h-5" /> Shipping Address
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold">{order.shippingAddress.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                            {order.shippingAddress.addressLine1 || order.shippingAddress.address}
                        </p>
                        <p className="text-sm text-gray-600">
                            {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                        </p>
                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                            <Phone className="w-4 h-4" /> {order.shippingAddress.phone}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={handleDownloadInvoice}>
                            <FileText className="w-4 h-4 mr-2" /> Download Invoice
                        </Button>

                        {canCancel && (
                            <Button
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={handleCancelOrder}
                                disabled={cancelling}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                {cancelling ? "Cancelling..." : "Cancel Order"}
                            </Button>
                        )}

                        {canReturn && (
                            <Link href={`/account/orders/${order._id}/return`}>
                                <Button variant="outline">
                                    <RotateCcw className="w-4 h-4 mr-2" /> Return / Replace
                                </Button>
                            </Link>
                        )}

                        <Link href="/contact">
                            <Button variant="outline">Need Help?</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
