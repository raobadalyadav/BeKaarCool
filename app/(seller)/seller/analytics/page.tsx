"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, Users, Package, DollarSign, Eye } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function SellerAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalViews: 0,
    topProducts: []
  })

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/seller/analytics?range=${timeRange}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error("Failed to fetch analytics")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your BeKaarCool performance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(data.totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">Lifetime earnings</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-700">{data.totalOrders}</p>
                <p className="text-xs text-gray-500 mt-1">All time orders</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-purple-700">{data.totalProducts}</p>
                <p className="text-xs text-gray-500 mt-1">Currently listed</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-orange-700">{data.totalViews.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Product page views</p>
              </div>
              <Eye className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length > 0 ? (
              <div className="space-y-4">
                {data.topProducts.map((product: any, i: number) => (
                  <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} sold</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-700">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-500">
                No sales data available yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center text-gray-500 space-y-2">
              <TrendingUp className="h-12 w-12 text-gray-300" />
              <p>Detailed chart visualization coming soon</p>
              <p className="text-sm text-gray-400">Requires additional historical data tracking</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}