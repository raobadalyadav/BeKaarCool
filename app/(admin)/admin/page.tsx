"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  BarChart3,
  PieChartIcon,
} from "lucide-react"
import Link from "next/link"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface DashboardData {
  stats: {
    totalRevenue: number
    todayRevenue: number
    totalOrders: number
    totalProducts: number
    activeUsers: number
    revenueChange: number
  }
  recentOrders: Array<{
    id: string
    customer: string
    product: string
    itemCount: number
    amount: number
    status: string
    paymentStatus: string
    date: string
  }>
  topProducts: Array<{
    id: string
    name: string
    image: string
    sold: number
    revenue: number
  }>
  ordersByStatus: Record<string, number>
  revenueChart?: Array<{ date: string; revenue: number; orders: number }>
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "#FCD34D",
  confirmed: "#60A5FA",
  processing: "#A78BFA",
  shipped: "#818CF8",
  delivered: "#34D399",
  cancelled: "#F87171",
  returned: "#FB923C",
}

const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658"]

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/admin/dashboard")
      if (!res.ok) {
        if (res.status === 403) throw new Error("Access denied. Admin role required.")
        throw new Error("Failed to fetch dashboard data")
      }
      const dashboardData = await res.json()
      setData(dashboardData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "confirmed": return "bg-blue-100 text-blue-800"
      case "processing": return "bg-purple-100 text-purple-800"
      case "shipped": return "bg-indigo-100 text-indigo-800"
      case "delivered": return "bg-green-100 text-green-800"
      case "cancelled": return "bg-red-100 text-red-800"
      case "returned": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // Prepare pie chart data from ordersByStatus
  const orderStatusPieData = data?.ordersByStatus
    ? Object.entries(data.ordersByStatus).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      fill: ORDER_STATUS_COLORS[status] || "#8884D8"
    }))
    : []

  // Revenue chart data
  const revenueChartData = data?.revenueChart || []

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchDashboard}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your BeKaarCool store</p>
        </div>
        <Button onClick={fetchDashboard} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : data && (
          <>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.stats.totalRevenue)}</p>
                    <div className="flex items-center mt-1">
                      {data.stats.revenueChange >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={data.stats.revenueChange >= 0 ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
                        {data.stats.revenueChange > 0 ? "+" : ""}{data.stats.revenueChange}%
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{data.stats.totalOrders.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">All time</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Products</p>
                    <p className="text-2xl font-bold text-gray-900">{data.stats.totalProducts.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Active</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{data.stats.activeUsers.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Last 30 days</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Pie Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Order Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : orderStatusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderStatusPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderStatusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, "Orders"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No order data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Weekly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="orders" fill="#82ca9d" name="Orders" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/admin/orders">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : data?.recentOrders && data.recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentOrders.slice(0, 5).map(order => (
                        <TableRow key={order.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{order.customer}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(order.amount)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500">{formatDate(order.date)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent orders</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products & Quick Actions */}
        <div className="space-y-6">
          {/* Top Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Products</CardTitle>
              <Link href="/admin/products">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : data?.topProducts && data.topProducts.length > 0 ? (
                <div className="space-y-4">
                  {data.topProducts.slice(0, 5).map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center font-bold text-purple-600">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sold} sold</p>
                      </div>
                      <p className="font-semibold text-sm text-green-600">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No products yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/products" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="w-4 h-4 mr-2" /> Add Product
                </Button>
              </Link>
              <Link href="/admin/orders" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingCart className="w-4 h-4 mr-2" /> View Orders
                </Button>
              </Link>
              <Link href="/admin/users" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" /> Manage Users
                </Button>
              </Link>
              <Link href="/admin/analytics" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" /> View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
