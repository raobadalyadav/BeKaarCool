"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import Script from "next/script"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, ChevronLeft, ChevronRight, Eye, Search, Download, X, AlertTriangle, RefreshCw, Truck, CheckCircle, XCircle, CreditCard } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import * as ordersApi from "@/lib/api/orders"
import { minorToRupees } from "@/lib/api/config"

interface OrderItem {
    product: {
        _id: string
        name: string
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
    paymentMethod?: string
    total: number
    totalAmount?: number
    items: OrderItem[]
    createdAt: string
    trackingNumber?: string
    estimatedDelivery?: string
}

interface Pagination {
    page: number
    limit: number
    total: number
    pages: number
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-purple-100 text-purple-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    refunded: "bg-gray-100 text-gray-700"
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function MyOrdersPage() {
    const { data: session } = useSession()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    })
    const [cancelReason, setCancelReason] = useState("")
    const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
    const [paymentProcessingId, setPaymentProcessingId] = useState<string | null>(null)
    const [razorpayLoaded, setRazorpayLoaded] = useState(false)

    useEffect(() => {
        if (session) {
            fetchOrders()
        }
    }, [session, pagination.page, statusFilter])

    useEffect(() => {
        if (typeof window !== "undefined" && window.Razorpay) {
            setRazorpayLoaded(true)
        }
    }, [])

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const list = await ordersApi.listOrders(pagination.limit)
            const mapped: Order[] = list
                .filter((o) => statusFilter === "all" || o.status === statusFilter)
                .map((o) => {
                    const opts0 = (() => {
                        try { return JSON.parse(o.items[0]?.variantOptionsJson ?? "{}") } catch { return {} }
                    })() as Record<string, string>
                    return {
                        _id: o.id,
                        orderNumber: o.number,
                        status: o.status,
                        paymentStatus: o.paymentStatus ?? "",
                        paymentMethod: o.paymentMethod ?? "",
                        total: minorToRupees(o.totalMinor),
                        items: o.items.map((it) => {
                            const opts = (() => {
                                try { return JSON.parse(it.variantOptionsJson ?? "{}") } catch { return {} }
                            })() as Record<string, string>
                            return {
                                product: {
                                    _id: it.variantId,
                                    name: it.productTitleSnapshot,
                                    slug: it.productSlug ?? "",
                                    images: it.productImage ? [it.productImage] : [],
                                    price: minorToRupees(it.unitPriceMinor),
                                },
                                quantity: it.quantity,
                                price: minorToRupees(it.unitPriceMinor),
                                size: opts.size,
                                color: opts.color,
                            }
                        }),
                        createdAt: o.placedAt ?? new Date().toISOString(),
                        ...(opts0.size && { _firstSize: opts0.size as string }),
                    }
                })
            setOrders(mapped)
            setPagination(prev => ({ ...prev, total: mapped.length, pages: 1 }))
        } catch (error) {
            console.error("Failed to fetch orders:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCancelOrder = async (orderNumber: string) => {
        if (!cancelReason.trim()) {
            toast.error("Please provide a reason for cancellation")
            return
        }

        setCancellingOrderId(orderNumber)
        try {
            await ordersApi.cancelOrder({ number: orderNumber, reason: cancelReason })
            toast.success("Order cancelled successfully")
            fetchOrders()
            setCancelReason("")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to cancel order")
        } finally {
            setCancellingOrderId(null)
        }
    }

    const handlePayNow = async (_order: Order) => {
        toast.error("Pay-now for pending orders is being rebuilt on the new backend.")
    }

    const handleDownloadInvoice = async (_orderId: string) => {
        toast.error("Invoice download is being rebuilt on the new backend.")
    }

    const filteredOrders = orders.filter(
        (order) =>
            order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.items.some((item) => item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())),
    )

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending": return <RefreshCw className="h-4 w-4" />
            case "confirmed":
            case "processing": return <Package className="h-4 w-4" />
            case "shipped": return <Truck className="h-4 w-4" />
            case "delivered": return <CheckCircle className="h-4 w-4" />
            case "cancelled":
            case "refunded": return <XCircle className="h-4 w-4" />
            default: return <Package className="h-4 w-4" />
        }
    }

    return (
        <>
        <Script
            src="https://checkout.razorpay.com/v1/checkout.js"
            onLoad={() => setRazorpayLoaded(true)}
        />
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                <p className="text-sm text-gray-500">Track and manage your orders</p>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search orders..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Orders</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="all" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="all">All Orders ({pagination.total})</TabsTrigger>
                    <TabsTrigger value="active">
                        Active ({orders.filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status.toLowerCase())).length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        Completed ({orders.filter((o) => o.status.toLowerCase() === "delivered").length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                            ))}
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="py-12 text-center">
                                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-700">No orders found</h3>
                                <p className="text-gray-500 mt-2">Try adjusting your filters or start shopping</p>
                                <Link href="/products">
                                    <Button className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold">Browse Products</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredOrders.map(order => (
                                <Card key={order._id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="bg-gray-50 px-6 py-3 border-b flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="font-semibold text-gray-900 border-r pr-4">Order #{order.orderNumber}</span>
                                            <span className="text-gray-500">{formatDate(order.createdAt)}</span>
                                        </div>
                                        <Badge className={statusColors[order.status.toLowerCase()] || "bg-gray-100"}>
                                            <div className="flex items-center gap-1">
                                                {getStatusIcon(order.status)}
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </div>
                                        </Badge>
                                    </div>

                                    <div className="p-6">
                                        <div className="space-y-4">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div className="w-16 h-20 relative bg-gray-100 rounded overflow-hidden flex-shrink-0 border">
                                                        {item.product?.images?.[0] ? (
                                                            <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-400" /></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-gray-900 truncate">{item.product?.name || "Product"}</h4>
                                                        <div className="mt-1 flex flex-wrap gap-2">
                                                            {item.size && <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">Size: {item.size}</Badge>}
                                                            {item.color && <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">{item.color}</Badge>}
                                                            <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5">Qty: {item.quantity}</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold">₹{Math.round(item.price)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between mt-6 pt-4 border-t gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500">Order Total</p>
                                                <p className="font-bold text-lg text-yellow-600">₹{(order.total || order.totalAmount || 0).toLocaleString("en-IN")}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Link href={`/account/orders/${order.orderNumber}`}>
                                                    <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-1" /> Details</Button>
                                                </Link>
                                                {order.paymentMethod === 'cod' && order.paymentStatus !== 'paid' && !["cancelled", "refunded", "delivered"].includes(order.status.toLowerCase()) && (
                                                    <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={paymentProcessingId === order._id} onClick={() => handlePayNow(order)}>
                                                        <CreditCard className="w-4 h-4 mr-1" /> 
                                                        {paymentProcessingId === order._id ? "Processing..." : "Pay Now"}
                                                    </Button>
                                                )}
                                                <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(order._id)}>
                                                    <Download className="w-4 h-4 mr-1" /> Invoice
                                                </Button>
                                                {["pending", "confirmed"].includes(order.status.toLowerCase()) && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600"><X className="w-4 h-4 mr-1" /> Cancel</Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="flex items-center gap-2">
                                                                    <AlertTriangle className="w-5 h-5 text-red-500" /> Cancel Order
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>Are you sure you want to cancel order #{order.orderNumber}?</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <div className="my-4">
                                                                <Textarea placeholder="Reason for cancellation..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                                                            </div>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel onClick={() => setCancelReason("")}>Keep Order</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleCancelOrder(order.orderNumber)} className="bg-red-500" disabled={cancellingOrderId === order.orderNumber || !cancelReason.trim()}>
                                                                    {cancellingOrderId === order.orderNumber ? "Cancelling..." : "Confirm Cancel"}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <Button
                                variant="outline"
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                            </Button>
                            <span className="text-sm font-medium">Page {pagination.page} of {pagination.pages}</span>
                            <Button
                                variant="outline"
                                disabled={pagination.page === pagination.pages}
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="active">
                    <div className="space-y-4">
                        {filteredOrders.filter(o => !["delivered", "cancelled", "refunded"].includes(o.status.toLowerCase())).length === 0 ? (
                             <Card className="py-12 text-center text-gray-500">No active orders</Card>
                        ) : (
                            filteredOrders.filter(o => !["delivered", "cancelled", "refunded"].includes(o.status.toLowerCase())).map(order => (
                                <Card key={order._id}>{/* Simplified card or reuse a sub-component */}</Card>
                            ))
                        )}
                        <p className="text-center text-sm text-gray-500 italic">Filter results based on current page. Use search for all orders.</p>
                    </div>
                </TabsContent>
                
                <TabsContent value="completed">
                     <div className="space-y-4">
                        {filteredOrders.filter(o => o.status.toLowerCase() === "delivered").length === 0 ? (
                             <Card className="py-12 text-center text-gray-500">No completed orders</Card>
                        ) : (
                            filteredOrders.filter(o => o.status.toLowerCase() === "delivered").map(order => (
                                <Card key={order._id}>{/* Simplified card or reuse a sub-component */}</Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        </>
    )
}
