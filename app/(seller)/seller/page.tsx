"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    Clock,
    CheckCircle,
    Truck,
    ArrowUp,
    ArrowDown,
    Star,
    Users,
    RefreshCw,
    Bell,
    ChevronRight,
    PackageCheck,
    Wallet,
    Target,
    Zap,
    IndianRupee,
} from "lucide-react"
import Link from "next/link"
import { formatDate, formatCurrency } from "@/lib/utils"

interface DashboardData {
    stats: {
        totalProducts: number
        activeProducts: number
        totalOrders: number
        pendingOrders: number
        processingOrders: number
        shippedOrders: number
        deliveredOrders: number
        totalRevenue: number
        thisMonthRevenue: number
        lastMonthRevenue: number
        pendingPayout: number
        totalPayout: number
    }
    recentOrders: Array<{
        id: string
        orderNumber: string
        customerName: string
        customerAvatar?: string
        amount: number
        status: string
        items: number
        date: string
    }>
    lowStockProducts: Array<{
        id: string
        name: string
        image?: string
        stock: number
        sold: number
    }>
    topProducts: Array<{
        id: string
        name: string
        image?: string
        sold: number
        revenue: number
    }>
    sellerInfo: {
        businessName: string
        status: string
        isVerified: boolean
        rating: number
        totalRatings: number
        fulfillmentRate: number
    }
}

export default function SellerDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        if (status === "loading") return
        if (!session) {
            router.push("/auth/login")
            return
        }
        if ((session.user as any).role !== "seller" && (session.user as any).role !== "admin") {
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

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchDashboard()
        setRefreshing(false)
    }

    const getRevenueChange = () => {
        if (!data?.stats) return 0
        const { thisMonthRevenue, lastMonthRevenue } = data.stats
        if (thisMonthRevenue === 0 && lastMonthRevenue === 0) return 0
        if (lastMonthRevenue === 0) return 100
        return Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    }

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending": return <Clock className="h-4 w-4" />
            case "confirmed": return <CheckCircle className="h-4 w-4" />
            case "processing": return <Package className="h-4 w-4" />
            case "shipped": return <Truck className="h-4 w-4" />
            case "delivered": return <PackageCheck className="h-4 w-4" />
            default: return <Clock className="h-4 w-4" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending": return "bg-yellow-100 text-yellow-800"
            case "confirmed": return "bg-blue-100 text-blue-800"
            case "processing": return "bg-purple-100 text-purple-800"
            case "shipped": return "bg-indigo-100 text-indigo-800"
            case "out_for_delivery": return "bg-orange-100 text-orange-800"
            case "delivered": return "bg-green-100 text-green-800"
            case "cancelled": return "bg-red-100 text-red-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    if (status === "loading" || loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-36 rounded-xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
                    <Skeleton className="h-80 rounded-xl" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={fetchDashboard}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const revenueChange = getRevenueChange()

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Welcome back, {session?.user?.name?.split(" ")[0]}! 👋
                        </h1>
                    </div>
                    <p className="text-gray-600 mt-1">
                        Here's what's happening with your store today
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Link href="/seller/products/new">
                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Product
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Seller Status Banner */}
            {data?.sellerInfo && data.sellerInfo.status !== "approved" && (
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="font-medium text-yellow-900">Account Status: {data.sellerInfo.status}</p>
                                <p className="text-sm text-yellow-700">Complete your profile to get your account approved</p>
                            </div>
                        </div>
                        <Link href="/seller/profile">
                            <Button variant="outline" className="border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                                Complete Profile
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 font-medium">Total Revenue</p>
                                <p className="text-3xl font-bold mt-1">
                                    ₹{((data?.stats?.totalRevenue || 0) / 1000).toFixed(1)}K
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    {revenueChange >= 0 ? (
                                        <ArrowUp className="h-4 w-4 text-green-200" />
                                    ) : (
                                        <ArrowDown className="h-4 w-4 text-red-200" />
                                    )}
                                    <span className="text-sm text-green-100">
                                        {Math.abs(revenueChange)}% vs last month
                                    </span>
                                </div>
                            </div>
                            <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                <IndianRupee className="h-7 w-7" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Orders */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 font-medium">Total Orders</p>
                                <p className="text-3xl font-bold mt-1">{data?.stats?.totalOrders || 0}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge className="bg-white/20 text-white hover:bg-white/30">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {data?.stats?.pendingOrders || 0} pending
                                    </Badge>
                                </div>
                            </div>
                            <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                <ShoppingCart className="h-7 w-7" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Products */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 font-medium">Products</p>
                                <p className="text-3xl font-bold mt-1">{data?.stats?.totalProducts || 0}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge className="bg-white/20 text-white hover:bg-white/30">
                                        <Zap className="h-3 w-3 mr-1" />
                                        {data?.stats?.activeProducts || 0} active
                                    </Badge>
                                </div>
                            </div>
                            <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Package className="h-7 w-7" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Payout */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 font-medium">Pending Payout</p>
                                <p className="text-3xl font-bold mt-1">
                                    ₹{((data?.stats?.pendingPayout || 0)).toLocaleString()}
                                </p>
                                <p className="text-sm text-orange-100 mt-2">
                                    Ready for withdrawal
                                </p>
                            </div>
                            <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Wallet className="h-7 w-7" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Order Fulfillment Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-l-4 border-l-yellow-500">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{data?.stats?.pendingOrders || 0}</p>
                            <p className="text-sm text-gray-500">Pending</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-purple-500">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Package className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{data?.stats?.processingOrders || 0}</p>
                            <p className="text-sm text-gray-500">Processing</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-blue-500">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{data?.stats?.shippedOrders || 0}</p>
                            <p className="text-sm text-gray-500">Shipped</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-green-500">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <PackageCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{data?.stats?.deliveredOrders || 0}</p>
                            <p className="text-sm text-gray-500">Delivered</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/seller/products">
                    <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-blue-300 group">
                        <CardContent className="p-6 flex flex-col items-center text-center">
                            <div className="h-14 w-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Package className="w-7 h-7 text-blue-600" />
                            </div>
                            <p className="font-medium">My Products</p>
                            <p className="text-sm text-gray-500">{data?.stats?.totalProducts || 0} items</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/seller/orders">
                    <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-purple-300 group">
                        <CardContent className="p-6 flex flex-col items-center text-center">
                            <div className="h-14 w-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <ShoppingCart className="w-7 h-7 text-purple-600" />
                            </div>
                            <p className="font-medium">Orders</p>
                            <p className="text-sm text-gray-500">{data?.stats?.pendingOrders || 0} pending</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/seller/analytics">
                    <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-green-300 group">
                        <CardContent className="p-6 flex flex-col items-center text-center">
                            <div className="h-14 w-14 bg-green-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <BarChart3 className="w-7 h-7 text-green-600" />
                            </div>
                            <p className="font-medium">Analytics</p>
                            <p className="text-sm text-gray-500">View insights</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/seller/profile">
                    <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-orange-300 group">
                        <CardContent className="p-6 flex flex-col items-center text-center">
                            <div className="h-14 w-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Settings className="w-7 h-7 text-orange-600" />
                            </div>
                            <p className="font-medium">Settings</p>
                            <p className="text-sm text-gray-500">Manage profile</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Orders</CardTitle>
                            <CardDescription>Your latest orders needing attention</CardDescription>
                        </div>
                        <Link href="/seller/orders">
                            <Button variant="outline" size="sm">
                                View All
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {data?.recentOrders && data.recentOrders.length > 0 ? (
                            <div className="space-y-4">
                                {data.recentOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={order.customerAvatar} />
                                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                                    {order.customerName?.[0] || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{order.orderNumber}</p>
                                                <p className="text-sm text-gray-500">
                                                    {order.customerName} • {order.items} items
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">₹{order.amount.toLocaleString()}</p>
                                            <Badge className={getStatusColor(order.status)}>
                                                <span className="flex items-center gap-1">
                                                    {getStatusIcon(order.status)}
                                                    <span className="capitalize">{order.status}</span>
                                                </span>
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No orders yet</p>
                                <p className="text-sm text-gray-400">Orders will appear here once you receive them</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Side Cards */}
                <div className="space-y-6">
                    {/* Low Stock Alert */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-600">
                                <AlertCircle className="h-5 w-5" />
                                Low Stock Alert
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
                                <div className="space-y-3">
                                    {data.lowStockProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                {product.image && (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="h-10 w-10 rounded object-cover"
                                                    />
                                                )}
                                                <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                                            </div>
                                            <Badge variant="destructive">{product.stock} left</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                                    <p className="text-gray-600 font-medium">All products well stocked!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Performance Card */}
                    {data?.sellerInfo && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Rating</span>
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                        <span className="font-medium">
                                            {data.sellerInfo.rating?.toFixed(1) || "N/A"}
                                        </span>
                                        <span className="text-gray-400 text-sm">
                                            ({data.sellerInfo.totalRatings || 0})
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Fulfillment Rate</span>
                                        <span className="font-medium">{data.sellerInfo.fulfillmentRate || 100}%</span>
                                    </div>
                                    <Progress value={data.sellerInfo.fulfillmentRate || 100} className="h-2" />
                                </div>
                                <div className="pt-2 border-t">
                                    <div className="flex items-center gap-2">
                                        {data.sellerInfo.isVerified ? (
                                            <Badge className="bg-green-100 text-green-700">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Verified Seller
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Pending Verification
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
