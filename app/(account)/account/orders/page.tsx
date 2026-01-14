"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, ChevronLeft, ChevronRight, Eye } from "lucide-react"

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
    total: number
    items: OrderItem[]
    createdAt: string
    trackingNumber?: string
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

export default function MyOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    })

    useEffect(() => {
        fetchOrders()
    }, [pagination.page])

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/orders?page=${pagination.page}&limit=${pagination.limit}`)
            if (res.ok) {
                const data = await res.json()
                setOrders(data.orders || [])
                setPagination(prev => ({
                    ...prev,
                    total: data.pagination?.total || 0,
                    pages: data.pagination?.pages || 0
                }))
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                <span className="text-sm text-gray-500">{pagination.total} orders</span>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-24 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">No orders yet</h3>
                        <p className="text-gray-500 mt-2">Start shopping to see your orders here</p>
                        <Link href="/products">
                            <Button className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
                                Browse Products
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="space-y-4">
                        {orders.map(order => (
                            <Card key={order._id} className="overflow-hidden">
                                <CardContent className="p-0">
                                    {/* Order Header */}
                                    <div className="bg-gray-50 px-6 py-3 border-b flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="font-medium">Order #{order.orderNumber}</span>
                                            <span className="text-gray-500">{formatDate(order.createdAt)}</span>
                                        </div>
                                        <Badge className={statusColors[order.status] || "bg-gray-100"}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </Badge>
                                    </div>

                                    {/* Order Items */}
                                    <div className="p-6">
                                        <div className="flex flex-wrap gap-4">
                                            {order.items.slice(0, 3).map((item, idx) => (
                                                <div key={idx} className="flex gap-3">
                                                    <div className="w-16 h-20 relative bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                        {item.product?.images?.[0] ? (
                                                            <Image
                                                                src={item.product.images[0]}
                                                                alt={item.product.name || "Product"}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Package className="w-6 h-6 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-sm">
                                                        <p className="font-medium line-clamp-1">{item.product?.name || "Product"}</p>
                                                        {item.size && <p className="text-gray-500">Size: {item.size}</p>}
                                                        <p className="text-gray-500">Qty: {item.quantity}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {order.items.length > 3 && (
                                                <div className="flex items-center text-sm text-gray-500">
                                                    +{order.items.length - 3} more items
                                                </div>
                                            )}
                                        </div>

                                        {/* Order Footer */}
                                        <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t gap-4">
                                            <div>
                                                <span className="text-sm text-gray-500">Total: </span>
                                                <span className="font-bold text-lg">₹{order.total.toLocaleString("en-IN")}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {order.trackingNumber && (
                                                    <Link href={`/track-order?awb=${order.trackingNumber}`}>
                                                        <Button variant="outline" size="sm">
                                                            Track Order
                                                        </Button>
                                                    </Link>
                                                )}
                                                <Link href={`/orders/${order._id}`}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="w-4 h-4 mr-1" /> View Details
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

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
                            <span className="text-sm text-gray-600">
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <Button
                                variant="outline"
                                disabled={pagination.page === pagination.pages}
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
