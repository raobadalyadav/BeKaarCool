"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Package,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    Plus,
    Eye,
    BarChart3,
    Settings,
    AlertCircle,
} from "lucide-react"
import Link from "next/link"

interface SellerDashboardData {
    stats: {
        totalProducts: number
        activeProducts: number
        totalOrders: number
        pendingOrders: number
        totalRevenue: number
        thisMonthRevenue: number
    }
    recentOrders: Array<{
        id: string
        orderNumber: string
        customerName: string
        amount: number
        status: string
        date: string
    }>
    lowStockProducts: Array<{
        id: string
        name: string
        stock: number
    }>
}

export default function SellerDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [data, setData] = useState<SellerDashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (status === "loading") return
        if (!session) {
            router.push("/auth/login")
            return
        }
        if ((session.user as any).role !== "seller") {
            router.push("/")
            return
        }
        fetchDashboard()
    }, [session, status])

    const fetchDashboard = async () => {
        try {
            setLoading(true)
            const res = await fetch("/api/seller/dashboard")
            if (!res.ok) throw new Error("Failed to fetch dashboard data")
            const dashboardData = await res.json()
            setData(dashboardData)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount)
    }

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <Skeleton className="h-10 w-64" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Error</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={fetchDashboard}>Try Again</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
                        <p className="text-gray-600">Welcome back, {session?.user?.name}</p>
                    </div>
                    <Link href="/seller/products/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Product
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Products</p>
                                    <p className="text-2xl font-bold">{data?.stats.totalProducts || 0}</p>
                                    <p className="text-sm text-green-600">{data?.stats.activeProducts || 0} active</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Package className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Orders</p>
                                    <p className="text-2xl font-bold">{data?.stats.totalOrders || 0}</p>
                                    <p className="text-sm text-orange-600">{data?.stats.pendingOrders || 0} pending</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <ShoppingCart className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Revenue</p>
                                    <p className="text-2xl font-bold">{formatCurrency(data?.stats.totalRevenue || 0)}</p>
                                    <p className="text-sm text-gray-400">All time</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <DollarSign className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">This Month</p>
                                    <p className="text-2xl font-bold">{formatCurrency(data?.stats.thisMonthRevenue || 0)}</p>
                                    <p className="text-sm text-green-600">+12% from last</p>
                                </div>
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Link href="/seller/products">
                        <Button variant="outline" className="w-full h-20 flex-col gap-2">
                            <Package className="w-5 h-5" />
                            My Products
                        </Button>
                    </Link>
                    <Link href="/seller/orders">
                        <Button variant="outline" className="w-full h-20 flex-col gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            Orders
                        </Button>
                    </Link>
                    <Link href="/seller/analytics">
                        <Button variant="outline" className="w-full h-20 flex-col gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Analytics
                        </Button>
                    </Link>
                    <Link href="/seller/settings">
                        <Button variant="outline" className="w-full h-20 flex-col gap-2">
                            <Settings className="w-5 h-5" />
                            Settings
                        </Button>
                    </Link>
                </div>

                {/* Recent Orders & Low Stock */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Orders */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Recent Orders</CardTitle>
                            <Link href="/seller/orders">
                                <Button variant="outline" size="sm">View All</Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {data?.recentOrders && data.recentOrders.length > 0 ? (
                                <div className="space-y-4">
                                    {data.recentOrders.map(order => (
                                        <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium">{order.orderNumber}</p>
                                                <p className="text-sm text-gray-500">{order.customerName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">{formatCurrency(order.amount)}</p>
                                                <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                                                    {order.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">No recent orders</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Low Stock Alert */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-orange-500" />
                                Low Stock Alert
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
                                <div className="space-y-3">
                                    {data.lowStockProducts.map(product => (
                                        <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                            <p className="font-medium truncate flex-1">{product.name}</p>
                                            <Badge variant="destructive">{product.stock} left</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">All products well stocked!</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
