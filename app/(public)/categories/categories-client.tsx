"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  ArrowRight,
  TrendingUp,
  Package,
  AlertCircle
} from "lucide-react"

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  icon?: string
  productCount?: number
  featured?: boolean
}

export default function CategoriesPageClient() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/categories?withCount=true")

      if (!response.ok) {
        throw new Error("Failed to fetch categories")
      }

      const data = await response.json()
      setCategories(data.categories || [])
    } catch (err) {
      console.error("Error fetching categories:", err)
      setError("Failed to load categories. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const featuredCategories = filteredCategories.filter(cat => cat.featured)
  const regularCategories = filteredCategories.filter(cat => !cat.featured)

  // Loading skeleton
  const CategorySkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-40 rounded-lg" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 text-black py-16 md:py-24">
        <div className="container px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Shop by Category
          </h1>
          <p className="text-xl md:text-2xl text-black/80 mb-8 max-w-2xl mx-auto">
            Explore our curated collection of fashion, accessories, and more
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search categories..."
              className="pl-10 bg-white border-white/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="container px-4 py-12">
        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button onClick={fetchCategories}>Try Again</Button>
          </div>
        )}

        {/* Featured Categories */}
        {!error && featuredCategories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <TrendingUp className="h-6 w-6 text-yellow-500 mr-2" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Categories</h2>
              <Badge className="ml-3 bg-yellow-100 text-yellow-700">Trending</Badge>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <CategorySkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredCategories.map((category) => (
                  <Link key={category._id} href={`/products?category=${encodeURIComponent(category.name)}`}>
                    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 overflow-hidden">
                      <CardContent className="p-0">
                        {category.image && (
                          <div className="relative h-40 w-full">
                            <Image
                              src={category.image}
                              alt={category.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                              <h3 className="font-bold text-lg">{category.name}</h3>
                              <p className="text-sm text-white/80">{category.productCount || 0} products</p>
                            </div>
                          </div>
                        )}
                        {!category.image && (
                          <div className="p-6 text-center">
                            <div className="text-4xl mb-3">{category.icon || "🛍️"}</div>
                            <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                            <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                            <Badge variant="secondary" className="text-xs">
                              {category.productCount || 0} products
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* All Categories */}
        {!error && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">All Categories</h2>
              <p className="text-gray-600">
                {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                  <CategorySkeleton key={i} />
                ))}
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
                <p className="text-gray-600">
                  {searchQuery ? "Try searching with different keywords" : "Categories will appear here once added"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {(regularCategories.length > 0 ? regularCategories : filteredCategories).map((category) => (
                  <Link key={category._id} href={`/products?category=${encodeURIComponent(category.name)}`}>
                    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-yellow-400 h-full overflow-hidden">
                      <CardContent className="p-0">
                        {category.image ? (
                          <div className="relative h-32 w-full">
                            <Image
                              src={category.image}
                              alt={category.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 text-white">
                              <h3 className="font-bold text-sm">{category.name}</h3>
                              <p className="text-xs text-white/80">{category.productCount || 0} items</p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 text-center">
                            <div className="text-3xl mb-2">{category.icon || "🛍️"}</div>
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">{category.name}</h3>
                            <p className="text-xs text-gray-500">{category.productCount || 0} items</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* CTA Section */}
        <section className="mt-16 text-center">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Can't find what you're looking for?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Browse all products or use our search to find exactly what you need
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold" asChild>
                <Link href="/products">
                  Browse All Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                <Link href="/products?featured=true">
                  View Featured
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