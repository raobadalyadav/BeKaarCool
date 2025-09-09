"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Package, ShoppingCart, TrendingUp, Eye, Plus, BarChart3, Calendar, Star } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function SellerDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalViews: 0,
    pendingOrders: 0,
    rating: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch seller stats
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        fetch("/api/seller/stats"),
        fetch("/api/seller/orders?limit=5"),
        fetch("/api/seller/products?sort=popular&limit=5"),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setRecentOrders(ordersData.orders || [])
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setTopProducts(productsData.products || [])
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Products",
      value: stats.totalProducts.toString(),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Product Views",
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/seller/products/new">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
          <Link href="/seller/analytics">
            <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">{stat.value}</p>
                  <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className={`p-4 rounded-2xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 bg-gradient-to-br from-white to-gray-50/50 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">Quick Actions</CardTitle>
          <p className="text-sm text-gray-600">Manage your store efficiently</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/seller/products/new" className="group">
              <div className="p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300 text-center group-hover:scale-105">
                <div className="h-12 w-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Add Product</h3>
                <p className="text-sm text-gray-600">Create new products</p>
              </div>
            </Link>
            <Link href="/seller/orders" className="group">
              <div className="p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-all duration-300 text-center group-hover:scale-105">
                <div className="h-12 w-12 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Manage Orders</h3>
                <p className="text-sm text-gray-600">Track and fulfill orders</p>
              </div>
            </Link>
            <Link href="/seller/analytics" className="group">
              <div className="p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-300 text-center group-hover:scale-105">
                <div className="h-12 w-12 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">View Analytics</h3>
                <p className="text-sm text-gray-600">Analyze performance</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Recent Orders</TabsTrigger>
          <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Top Products</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Summary */}
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-gray-900">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">Pending Orders</span>
                  <Badge variant={stats.pendingOrders > 0 ? "destructive" : "secondary"} className="shadow-sm">{stats.pendingOrders}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">Average Rating</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="ml-1 text-sm font-semibold">{stats.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">Growth This Month</span>
                  <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-lg">+12.5%</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-gray-900">
                  <div className="h-8 w-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">New Orders</span>
                  <span className="text-lg font-bold text-gray-900">24</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">Revenue</span>
                  <span className="text-lg font-bold text-gray-900">₹45,230</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">Products Sold</span>
                  <span className="text-lg font-bold text-gray-900">156</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-gray-900">Recent Orders</CardTitle>
              <p className="text-sm text-gray-600">Latest orders from your customers</p>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                    <ShoppingCart className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent orders</h3>
                  <p className="text-gray-600">Orders will appear here once customers start purchasing</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order: any) => (
                    <div key={order._id} className="flex items-center justify-between p-6 bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">Order #{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="font-bold text-lg text-gray-900">₹{order.totalAmount.toLocaleString()}</p>
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "default"
                              : order.status === "shipped"
                                ? "secondary"
                                : order.status === "processing"
                                  ? "outline"
                                  : "destructive"
                          }
                          className="shadow-sm"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-gray-900">Top Performing Products</CardTitle>
              <p className="text-sm text-gray-600">Your best-selling products this month</p>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl flex items-center justify-center">
                    <Package className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
                  <p className="text-gray-600 mb-6">Start by adding your first product to get started</p>
                  <Link href="/seller/products/new">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Product
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product: any) => (
                    <div key={product._id} className="flex items-center justify-between p-6 bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={product.images[0] || "/placeholder.svg"}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow"
                          />
                          <div className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">#1</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{product.name}</p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">{product.sold}</span> sold • <span className="font-medium">{product.views}</span> views
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="font-bold text-lg text-gray-900">₹{product.price.toLocaleString()}</p>
                        <div className="flex items-center justify-end">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="ml-1 text-sm font-medium">{product.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
