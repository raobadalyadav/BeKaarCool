"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductCard } from "@/components/product/product-card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ChevronRight, Star, Truck, RefreshCcw, ShieldCheck, AlertCircle } from "lucide-react"

// Interfaces
interface Product {
  _id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  rating: number
  sold: number
  featured: boolean
  recommended?: boolean
  createdAt: string
  stock: number
  seller?: {
    name: string
    avatar?: string
  }
}

interface Category {
  _id: string
  name: string
  slug: string
  image?: string
  icon?: string
  productCount?: number
}

interface Banner {
  _id: string
  title: string
  subtitle?: string
  image: string
  mobileImage?: string
  link?: string
  linkText?: string
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHomeData()
  }, [])

  const fetchHomeData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [productsRes, categoriesRes, bannersRes] = await Promise.all([
        fetch("/api/products?limit=50"),
        fetch("/api/categories?withCount=true&featured=true"),
        fetch("/api/banners?placement=homepage")
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.products || [])
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData || [])
      }

      if (bannersRes.ok) {
        const bannersData = await bannersRes.json()
        setBanners(bannersData || [])
      }
    } catch (err) {
      console.error("Error fetching home data:", err)
      setError("Failed to load content. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  // Track banner click
  const trackBannerClick = async (bannerId: string) => {
    try {
      await fetch(`/api/banners/${bannerId}/click`, { method: "POST" })
    } catch (err) {
      // Silent fail for analytics
    }
  }

  // Filter Products
  const trendingProducts = [...products].sort((a, b) => b.sold - a.sold).slice(0, 10)
  const newArrivals = [...products].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 10)
  const featuredProducts = products.filter(p => p.featured).slice(0, 10)

  // Empty State Component
  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
      <p className="text-gray-500">{message}</p>
      <Button variant="outline" onClick={fetchHomeData} className="mt-4">
        Try Again
      </Button>
    </div>
  )

  // Banner Carousel Component
  const BannerCarousel = () => {
    if (loading) {
      return (
        <div className="w-full bg-background pt-2 pb-4 md:py-6">
          <div className="max-w-[1400px] mx-auto px-4 flex gap-4 overflow-hidden">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="flex-shrink-0 w-[300px] md:w-[400px] aspect-[4/5] md:aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      )
    }

    if (banners.length === 0) {
      return null // Don't show empty banner section
    }

    return (
      <div className="w-full bg-background pt-2 pb-4 md:py-6">
        <Carousel
          opts={{ align: "center", loop: true }}
          className="w-full max-w-[1400px] mx-auto relative px-4"
        >
          <CarouselContent>
            {banners.map((banner) => (
              <CarouselItem key={banner._id} className="basis-10/12 md:basis-1/2 lg:basis-1/3 p-2 pl-4">
                <Link
                  href={banner.link || "#"}
                  onClick={() => trackBannerClick(banner._id)}
                  className="block relative aspect-[4/5] md:aspect-square overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-shadow group"
                >
                  <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col items-start justify-end p-6">
                    <h3 className="text-white text-xl md:text-2xl font-bold uppercase tracking-wider">
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-white/80 text-sm mt-1">{banner.subtitle}</p>
                    )}
                    {banner.linkText && (
                      <span className="mt-3 text-xs font-semibold text-white bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                        {banner.linkText}
                      </span>
                    )}
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 z-10 hidden md:flex" />
          <CarouselNext className="right-4 z-10 hidden md:flex" />
        </Carousel>
      </div>
    )
  }

  // Section Header Component
  const SectionHeader = ({ title, link }: { title: string; link?: string }) => (
    <div className="flex items-center justify-between mb-4 md:mb-6 px-4 md:px-0 container mx-auto">
      <h2 className="text-lg md:text-2xl font-bold text-gray-900 tracking-wide uppercase">{title}</h2>
      {link && (
        <Link href={link} className="text-xs md:text-sm font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )

  // Product Slider Component
  const ProductSlider = ({ title, products, link }: { title: string; products: Product[]; link?: string }) => {
    if (loading) {
      return (
        <section className="py-8 md:py-12 bg-white">
          <SectionHeader title={title} link={link} />
          <div className="container mx-auto px-4">
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="w-[160px] md:w-[240px] h-[300px] flex-shrink-0 rounded-lg" />
              ))}
            </div>
          </div>
        </section>
      )
    }

    if (products.length === 0) {
      return null // Don't show empty product sections
    }

    return (
      <section className="py-8 md:py-12 bg-white">
        <SectionHeader title={title} link={link} />
        <div className="container mx-auto px-0 md:px-4">
          <Carousel opts={{ align: "start", dragFree: true }} className="w-full px-4 md:px-0">
            <CarouselContent className="-ml-2 md:-ml-4">
              {products.map(product => (
                <CarouselItem key={product._id} className="pl-2 md:pl-4 basis-[45%] md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                  <ProductCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </div>
      </section>
    )
  }

  // Categories Grid Component
  const CategoriesGrid = () => {
    if (loading) {
      return (
        <section className="py-6 md:py-10 container mx-auto px-4">
          <SectionHeader title="Shop By Category" />
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
            ))}
          </div>
        </section>
      )
    }

    if (categories.length === 0) {
      return null
    }

    return (
      <section className="py-6 md:py-10 container mx-auto px-4">
        <SectionHeader title="Shop By Category" link="/categories" />
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
          {categories.map((cat) => (
            <Link key={cat._id} href={`/products?category=${encodeURIComponent(cat.name)}`} className="group block">
              <div className="aspect-[3/4] relative overflow-hidden rounded-lg shadow-sm bg-gray-100">
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <span className="text-4xl">{cat.icon || "🛍️"}</span>
                  </div>
                )}
              </div>
              <div className="text-center mt-2">
                <span className="text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wide group-hover:text-black">
                  {cat.name}
                </span>
                {cat.productCount !== undefined && (
                  <p className="text-xs text-gray-400">{cat.productCount} items</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  // Error State
  if (error && !loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState message={error} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 1. Hero Carousel */}
      <BannerCarousel />

      {/* 2. Categories Grid */}
      <CategoriesGrid />

      {/* 3. New Arrivals */}
      <ProductSlider title="New Arrivals" products={newArrivals} link="/products?sort=newest" />

      {/* 4. Promotional Banner */}
      {!loading && products.length > 0 && (
        <div className="py-4 md:py-8 container mx-auto px-4">
          <div className="relative w-full aspect-[4/1] md:aspect-[6/1] bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg overflow-hidden flex items-center justify-center">
            <span className="text-xl md:text-4xl font-black text-white uppercase tracking-tighter z-10 drop-shadow-lg">
              Style of the Week
            </span>
          </div>
        </div>
      )}

      {/* 5. Best Sellers */}
      <ProductSlider title="Best Sellers" products={trendingProducts} link="/products?sort=trending" />

      {/* 6. Featured Products */}
      {featuredProducts.length > 0 && (
        <ProductSlider title="Featured" products={featuredProducts} link="/products?featured=true" />
      )}

      {/* 7. Features / Trust Badges */}
      <section className="py-8 bg-white border-t mt-8">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
          <div className="flex flex-col items-center text-center gap-2">
            <Truck className="w-8 h-8 text-gray-400" />
            <p className="text-xs font-bold text-gray-500 uppercase">Fast Delivery</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <RefreshCcw className="w-8 h-8 text-gray-400" />
            <p className="text-xs font-bold text-gray-500 uppercase">7 Days Return</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <ShieldCheck className="w-8 h-8 text-gray-400" />
            <p className="text-xs font-bold text-gray-500 uppercase">100% Secure Payment</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <Star className="w-8 h-8 text-gray-400" />
            <p className="text-xs font-bold text-gray-500 uppercase">Quality Guarantee</p>
          </div>
        </div>
      </section>
    </div>
  )
}
