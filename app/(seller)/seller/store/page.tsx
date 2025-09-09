"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Store, Eye, Share2, Star, Package, Users, TrendingUp, ExternalLink, Copy, Facebook, Twitter, Instagram } from "lucide-react"

interface StoreData {
  name: string
  description: string
  logo: string
  banner: string
  rating: number
  totalProducts: number
  totalCustomers: number
  totalSales: number
  storeUrl: string
  socialLinks: {
    facebook?: string
    twitter?: string
    instagram?: string
  }
  featuredProducts: Array<{
    _id: string
    name: string
    price: number
    image: string
    rating: number
    sales: number
  }>
  recentOrders: Array<{
    _id: string
    orderNumber: string
    customer: string
    total: number
    status: string
    date: string
  }>
}

export default function StorePage() {
  const [storeData, setStoreData] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchStoreData()
  }, [])

  const fetchStoreData = async () => {
    try {
      const response = await fetch("/api/seller/store")
      if (response.ok) {
        const data = await response.json()
        setStoreData(data.store)
      }
    } catch (error) {
      console.error("Error fetching store data:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyStoreUrl = () => {
    if (storeData?.storeUrl) {
      navigator.clipboard.writeText(storeData.storeUrl)
      // Show success message
    }
  }

  const shareStore = (platform: string) => {
    if (!storeData?.storeUrl) return

    const url = encodeURIComponent(storeData.storeUrl)
    const text = encodeURIComponent(`Check out ${storeData.name} - Amazing custom products!`)

    let shareUrl = ""
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
        break
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`
        break
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${text} ${url}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400")
    }
  }

  if (loading || !storeData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Store</h1>
          <p className="text-gray-600">Manage and preview your online store</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => window.open(storeData.storeUrl, "_blank")}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Store
          </Button>
          <Button>
            <Share2 className="h-4 w-4 mr-2" />
            Share Store
          </Button>
        </div>
      </div>

      {/* Store Banner */}
      <Card>
        <div className="relative h-48 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg">
          <div className="absolute inset-0 bg-black bg-opacity-20 rounded-t-lg"></div>
          <div className="absolute bottom-6 left-6 flex items-end space-x-4">
            <Avatar className="h-20 w-20 border-4 border-white">
              <AvatarImage src={storeData.logo} />
              <AvatarFallback className="text-2xl">{storeData.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{storeData.name}</h2>
              <p className="text-blue-100">{storeData.description}</p>
              <div className="flex items-center space-x-1 mt-1">
                <Star className="h-4 w-4 fill-current text-yellow-400" />
                <span className="font-medium">{storeData.rating}</span>
                <span className="text-blue-100">({storeData.totalCustomers} customers)</span>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm font-mono">{storeData.storeUrl}</span>
                <Button size="sm" variant="ghost" onClick={copyStoreUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={() => shareStore("facebook")}>
                <Facebook className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => shareStore("twitter")}>
                <Twitter className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => shareStore("whatsapp")}>
                <span className="h-4 w-4 flex items-center justify-center text-green-600 font-bold">W</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-blue-600">{storeData.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-green-600">{storeData.totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-purple-600">{storeData.totalSales}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Store Rating</p>
                <p className="text-2xl font-bold text-orange-600">{storeData.rating}</p>
              </div>
              <Star className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Store Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Featured Products</TabsTrigger>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          <TabsTrigger value="settings">Store Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Products Listed</span>
                    <span className="font-semibold text-blue-600">{storeData.totalProducts}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Active Customers</span>
                    <span className="font-semibold text-green-600">{storeData.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">Total Orders</span>
                    <span className="font-semibold text-purple-600">{storeData.totalSales}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium">Average Rating</span>
                    <span className="font-semibold text-orange-600">{storeData.rating}/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Store Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6">
                    <div className="h-32 w-32 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                      <Store className="h-16 w-16 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Growing Store</h3>
                    <p className="text-gray-600">Your store is performing well with steady growth in customers and sales.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Featured Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storeData.featuredProducts.map((product) => (
                  <div key={product._id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-green-600">₹{product.price}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm">{product.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{product.sales} sales</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {storeData.recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-semibold">{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">{order.customer}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{order.total.toLocaleString()}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                          {order.status}
                        </Badge>
                        <span className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Store Customization</h3>
                  <p className="text-blue-700 text-sm mb-3">
                    Customize your store appearance, add social links, and manage store policies.
                  </p>
                  <Button size="sm">
                    Go to Settings
                  </Button>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">SEO Optimization</h3>
                  <p className="text-green-700 text-sm mb-3">
                    Optimize your store for search engines to increase visibility and attract more customers.
                  </p>
                  <Button size="sm" variant="outline">
                    Optimize SEO
                  </Button>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">Analytics & Insights</h3>
                  <p className="text-purple-700 text-sm mb-3">
                    Get detailed analytics about your store performance and customer behavior.
                  </p>
                  <Button size="sm" variant="outline">
                    View Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}