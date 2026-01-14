"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductCard } from "@/components/product/product-card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ChevronRight, Star, Truck, RefreshCcw, ShieldCheck } from "lucide-react"

// Interfaces
interface Product {
  _id: string
  name: string
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
  seller: {
    name: string
    avatar?: string
  }
}

interface Category {
  name: string
  count: number
  image?: string // Added image support for categories
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchHomeData()
  }, [])

  const fetchHomeData = async () => {
    try {
      setLoading(true)
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/products?limit=50"), // Fetch more products for multiple sliders
        fetch("/api/products/categories"),
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.products || [])
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        // Map categories to include placeholder images if not present
        const mappedCategories = categoriesData.map((cat: any) => ({
          ...cat,
          image: cat.image || `/images/categories/${cat.name.toLowerCase().replace(" ", "-")}.jpg`
        }))
        setCategories(mappedCategories)
      }
    } catch (error) {
      console.error("Error fetching home data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fallback Data
  const dummyProducts: Product[] = [
    {
      _id: "1",
      name: "Men's Oversized T-Shirt - Black",
      description: "Comfortable oversized t-shirt for daily wear.",
      price: 499,
      originalPrice: 999,
      images: ["https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=400"],
      category: "Men",
      rating: 4.5,
      sold: 120,
      featured: true,
      stock: 10,
      seller: { name: "BeKaarCool" },
      createdAt: new Date().toISOString()
    },
    {
      _id: "2",
      name: "Sleek Urban Jacket - Navy",
      description: "Perfect for winter evenings.",
      price: 1299,
      originalPrice: 2499,
      images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=400"],
      category: "Men",
      rating: 4.8,
      sold: 85,
      featured: true,
      stock: 5,
      seller: { name: "UrbanFit" },
      createdAt: new Date().toISOString()
    },
    {
      _id: "3",
      name: "Women's Floral Summer Dress",
      description: "Light and breezy for the summer heat.",
      price: 899,
      originalPrice: 1999,
      images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=400"],
      category: "Women",
      rating: 4.6,
      sold: 200,
      featured: true,
      stock: 15,
      seller: { name: "BeKaarCool" },
      createdAt: new Date().toISOString()
    },
    {
      _id: "4",
      name: "Classic Denim Jeans",
      description: "Rugged and durable denim.",
      price: 1499,
      originalPrice: 2999,
      images: ["https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&q=80&w=400"],
      category: "Men",
      rating: 4.4,
      sold: 150,
      featured: false,
      stock: 20,
      seller: { name: "DenimCo" },
      createdAt: new Date().toISOString()
    },
    {
      _id: "5",
      name: "Casual White Sneakers",
      description: "Essential white sneakers for every wardrobe.",
      price: 1999,
      originalPrice: 3999,
      images: ["https://images.unsplash.com/photo-1560769629-975e53efa466?auto=format&fit=crop&q=80&w=400"],
      category: "Footwear",
      rating: 4.7,
      sold: 300,
      featured: true,
      stock: 8,
      seller: { name: "SoleMates" },
      createdAt: new Date().toISOString()
    },
    {
      _id: "6",
      name: "Graphic Printed Hoodie",
      description: "Stand out with this unique graphic hoodie.",
      price: 899,
      originalPrice: 1499,
      images: ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=400"],
      category: "Men",
      rating: 4.3,
      sold: 90,
      featured: true,
      stock: 12,
      seller: { name: "PrintMasters" },
      createdAt: new Date().toISOString()
    }
  ]

  // Filter Products (Use dummy data if state is empty)
  const displayProducts = products.length > 0 ? products : dummyProducts

  const trendingProducts = [...displayProducts].sort((a, b) => b.sold - a.sold).slice(0, 10)
  const newArrivals = [...displayProducts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)

  // Banner Data (Unsplash Images)
  const banners = [
    {
      id: 1,
      img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=1200",
      alt: "Men's Collection",
      link: "/products?category=Men"
    },
    {
      id: 2,
      img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200",
      alt: "Women's Fashion",
      link: "/products?category=Women"
    },
    {
      id: 3,
      img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200",
      alt: "Winter Collection",
      link: "/products?category=Winterwear"
    }
  ]

  // Category Tiles (Unsplash Images)
  const categoryTiles = [
    { name: "Live Now", img: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=300" },
    { name: "Men", img: "https://images.unsplash.com/photo-1488161628813-99c974c76949?auto=format&fit=crop&q=80&w=300" },
    { name: "Women", img: "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?auto=format&fit=crop&q=80&w=300" },
    { name: "Accessories", img: "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?auto=format&fit=crop&q=80&w=300" },
    { name: "Winterwear", img: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&q=80&w=300" },
    { name: "Plus Size", img: "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&q=80&w=300" }
  ]

  const BannerCarousel = () => (
    <div className="w-full bg-background pt-2 pb-4 md:py-6">
      <Carousel
        opts={{ align: "center", loop: true }}
        className="w-full max-w-[1400px] mx-auto relative px-4"
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id} className="basis-10/12 md:basis-1/2 lg:basis-1/3 p-2 pl-4">
              <Link href={banner.link} className="block relative aspect-[4/5] md:aspect-square overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-shadow group">
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                <Image
                  src={banner.img}
                  alt={banner.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  priority={banner.id <= 3}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-white text-xl md:text-2xl font-bold uppercase tracking-wider">{banner.alt}</h3>
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

  const SectionHeader = ({ title, link }: { title: string, link?: string }) => (
    <div className="flex items-center justify-between mb-4 md:mb-6 px-4 md:px-0 container mx-auto">
      <h2 className="text-lg md:text-2xl font-bold text-gray-900 tracking-wide uppercase">{title}</h2>
      {link && (
        <Link href={link} className="text-xs md:text-sm font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )

  const ProductSlider = ({ title, products, link }: { title: string, products: Product[], link?: string }) => (
    <section className="py-8 md:py-12 bg-white">
      <SectionHeader title={title} link={link} />
      <div className="container mx-auto px-0 md:px-4">
        {loading && products.length === 0 ? (
          <div className="flex gap-4 overflow-hidden px-4 md:px-0">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="w-[160px] md:w-[240px] h-[300px] flex-shrink-0 rounded-lg" />
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </section>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 1. Hero Carousel */}
      <BannerCarousel />

      {/* 2. Trending Categories - Rectangular Tiles */}
      <section className="py-6 md:py-10 container mx-auto px-4">
        <SectionHeader title="Trending Categories" />
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
          {categoryTiles.map((cat, idx) => (
            <Link key={idx} href={`/products?category=${encodeURIComponent(cat.name)}`} className="group block">
              <div className="aspect-[3/4] relative overflow-hidden rounded-lg shadow-sm">
                <div className="absolute inset-0 bg-gray-100" />
                <Image
                  src={cat.img}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="text-center mt-2">
                <span className="text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wide group-hover:text-black">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Horizontal Product Sliders */}
      <ProductSlider title="New Arrivals" products={newArrivals} link="/products?sort=newest" />

      {/* 4. Banner Strip */}
      <div className="py-4 md:py-8 container mx-auto px-4">
        <div className="relative w-full aspect-[4/1] md:aspect-[6/1] bg-yellow-400 rounded-lg overflow-hidden flex items-center justify-center">
          <span className="text-xl md:text-4xl font-black text-black uppercase tracking-tighter z-10">
            Style of the Week
          </span>
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200"
            alt="Promotion"
            fill
            className="object-cover opacity-20 mix-blend-overlay"
          />
        </div>
      </div>

      <ProductSlider title="Best Sellers" products={trendingProducts} link="/products?sort=trending" />

      {/* 5. Features / Trust Badges */}
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
