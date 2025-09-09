"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Shirt, 
  Coffee, 
  Smartphone, 
  ShoppingBag, 
  Star, 
  Package,
  Search,
  ArrowRight,
  TrendingUp,
  Zap,
  Headphones,
  Watch,
  Camera,
  Gamepad2,
  Laptop,
  Monitor,
  Glasses,
  Crown,
  Gem,
  Palette
} from "lucide-react"

interface Category {
  name: string
  count: number
  icon: any
  color: string
  description: string
  trending?: boolean
}

export default function CategoriesPageClient() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const mockCategories: Category[] = [
    {
      name: "Fashion",
      count: 1250,
      icon: Shirt,
      color: "text-pink-600",
      description: "Trendy clothing and accessories",
      trending: true
    },
    {
      name: "Electronics",
      count: 890,
      icon: Smartphone,
      color: "text-blue-600",
      description: "Tech gadgets and accessories",
      trending: true
    },
    {
      name: "T-Shirts",
      count: 450,
      icon: Shirt,
      color: "text-indigo-600",
      description: "Custom printed t-shirts"
    },
    {
      name: "Hoodies",
      count: 320,
      icon: Shirt,
      color: "text-purple-600",
      description: "Comfortable hoodies and sweatshirts"
    },
    {
      name: "Mobile Covers",
      count: 680,
      icon: Smartphone,
      color: "text-green-600",
      description: "Protective phone cases"
    },
    {
      name: "Headphones",
      count: 245,
      icon: Headphones,
      color: "text-slate-600",
      description: "Audio devices and accessories"
    },
    {
      name: "Watches",
      count: 180,
      icon: Watch,
      color: "text-amber-600",
      description: "Smart and fashion watches"
    },
    {
      name: "Cameras",
      count: 95,
      icon: Camera,
      color: "text-red-600",
      description: "Photography equipment"
    },
    {
      name: "Gaming",
      count: 340,
      icon: Gamepad2,
      color: "text-violet-600",
      description: "Gaming accessories and gear"
    },
    {
      name: "Laptops",
      count: 125,
      icon: Laptop,
      color: "text-gray-600",
      description: "Computers and accessories"
    },
    {
      name: "Monitors",
      count: 85,
      icon: Monitor,
      color: "text-cyan-600",
      description: "Display screens and monitors"
    },
    {
      name: "Eyewear",
      count: 220,
      icon: Glasses,
      color: "text-teal-600",
      description: "Sunglasses and optical frames"
    },
    {
      name: "Jewelry",
      count: 380,
      icon: Gem,
      color: "text-rose-600",
      description: "Fashion jewelry and accessories"
    },
    {
      name: "Art & Design",
      count: 290,
      icon: Palette,
      color: "text-orange-600",
      description: "Creative supplies and artwork"
    },
    {
      name: "Mugs",
      count: 340,
      icon: Coffee,
      color: "text-brown-600",
      description: "Custom printed mugs and drinkware"
    },
    {
      name: "Bags",
      count: 280,
      icon: ShoppingBag,
      color: "text-emerald-600",
      description: "Bags, backpacks and totes"
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCategories(mockCategories)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const trendingCategories = categories.filter(cat => cat.trending)
  const regularCategories = categories.filter(cat => !cat.trending)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-16 md:py-24">
        <div className="container px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Browse Categories
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Discover products across all categories and find exactly what you're looking for
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search categories..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="container px-4 py-12">
        {/* Trending Categories */}
        {trendingCategories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <TrendingUp className="h-6 w-6 text-red-500 mr-2" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Trending Categories</h2>
              <Badge className="ml-3 bg-red-100 text-red-600">Hot</Badge>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {trendingCategories.map((category) => {
                  const Icon = category.icon
                  return (
                    <Link key={category.name} href={`/products?category=${encodeURIComponent(category.name)}`}>
                      <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
                        <CardContent className="p-6 text-center">
                          <div className="relative">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 group-hover:bg-red-200 transition-colors mb-4">
                              <Icon className={`h-8 w-8 ${category.color} group-hover:scale-110 transition-transform`} />
                            </div>
                            <Zap className="absolute -top-1 -right-1 h-5 w-5 text-red-500" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                          <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                          <Badge variant="secondary" className="text-xs">
                            {category.count} products
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* All Categories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">All Categories</h2>
            <p className="text-gray-600">
              {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-600">Try searching with different keywords</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCategories.map((category) => {
                const Icon = category.icon
                return (
                  <Link key={category.name} href={`/products?category=${encodeURIComponent(category.name)}`}>
                    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-200 h-full">
                      <CardContent className="p-6 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 group-hover:bg-blue-50 transition-colors mb-4">
                          <Icon className={`h-8 w-8 ${category.color} group-hover:scale-110 transition-transform`} />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                        <Badge variant="secondary" className="text-xs">
                          {category.count} products
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Can't find what you're looking for?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Browse all products or use our advanced search to find exactly what you need
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/products">
                  Browse All Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                <Link href="/products?sort=trending">
                  View Trending
                  <TrendingUp className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}