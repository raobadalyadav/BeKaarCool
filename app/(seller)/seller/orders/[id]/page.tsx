"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    ChevronLeft,
    Printer,
    Download,
    User,
    MapPin,
    CreditCard,
    Package,
    Truck,
    CheckCircle,
    Clock,
    AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import Image from "next/image"

export default function SellerOrderDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (params.id) {
            fetchOrderDetails()
        }
    }, [params.id])

    const fetchOrderDetails = async () => {
        try {
            const res = await fetch(`/api/seller/orders/${params.id}`)
            if (!res.ok) throw new Error("Failed to fetch order")
            const data = await res.json()
            setOrder(data.order)
        } catch (error) {
            toast({ title: "Error", description: "Could not load order details", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/seller/orders/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            })
            if (res.ok) {
                toast({ title: "Success", description: "Order status updated" })
                fetchOrderDetails()
            } else {
                throw new Error("Failed to update")
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
        }
    }

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "pending": return "bg-yellow-100 text-yellow-800"
            case "confirmed": return "bg-blue-100 text-blue-800"
            case "processing": return "bg-purple-100 text-purple-800"
            case "shipped": return "bg-indigo-100 text-indigo-800"
            case "delivered": return "bg-green-100 text-green-800"
            case "cancelled": return "bg-red-100 text-red-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    if (loading) return <div className="p-8 text-center">Loading order details...</div>
    if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            Order #{order.orderNumber}
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Placed on {formatDate(order.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Invoice
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                                        <div className="h-20 w-20 relative bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                            {item.product?.images?.[0] ? (
                                                <Image
                                                    src={item.product.images[0]}
                                                    alt={item.product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <Package className="h-8 w-8 m-auto text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium line-clamp-2">{item.product?.name || "Product"}</h4>
                                            <div className="text-sm text-gray-500 mt-1">
                                                Qty: {item.quantity} × {formatCurrency(item.price)}
                                            </div>
                                        </div>
                                        <div className="text-right font-medium">
                                            {formatCurrency(item.price * item.quantity)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-4" />
                            <div className="flex justify-between items-center font-medium">
                                <span>Subtotal</span>
                                <span>{formatCurrency(order.sellerTotal || order.totalAmount)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline / Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center gap-2 p-4 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700">Current Status: {order.status}</span>
                                {order.status === 'pending' && (
                                    <Button onClick={() => updateStatus('confirmed')}>Confirm Order</Button>
                                )}
                                {order.status === 'confirmed' && (
                                    <Button onClick={() => updateStatus('processing')}>Process Order</Button>
                                )}
                                {order.status === 'processing' && (
                                    <Button onClick={() => updateStatus('shipped')}>Mark Shipped</Button>
                                )}
                                {order.status === 'shipped' && (
                                    <Button onClick={() => updateStatus('delivered')} variant="default" className="bg-green-600 hover:bg-green-700">
                                        Mark Delivered
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4" /> Customer Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                                    {order.user?.name?.[0]?.toUpperCase() || "G"}
                                </div>
                                <div>
                                    <p className="font-medium">{order.user?.name || "Guest User"}</p>
                                    <p className="text-gray-500">{order.user?.email}</p>
                                    <p className="text-gray-500">{order.user?.phone || order.shippingAddress?.phone}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> Shipping Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1 text-gray-600">
                            {order.shippingAddress ? (
                                <>
                                    <p className="font-medium text-gray-900">{order.shippingAddress.name || order.user?.name}</p>
                                    <p>{order.shippingAddress.address}</p>
                                    <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                                    <p>{order.shippingAddress.pincode}</p>
                                    <p>{order.shippingAddress.country}</p>
                                </>
                            ) : (
                                <p className="text-gray-400 italic">No shipping address provided</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <CreditCard className="h-4 w-4" /> Payment Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Method</span>
                                <span className="font-medium capitalize">{order.paymentMethod || "Online"}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Status</span>
                                <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'} className={
                                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }>
                                    {order.paymentStatus}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
