"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "@/components/product/product-card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  ChevronRight,
  Star,
  Truck,
  RefreshCcw,
  ShieldCheck,
  AlertCircle,
  Clock,
  Zap,
  Heart,
  Gift,
  Percent,
  Tag,
  ArrowRight,
} from "lucide-react"
import * as productsApi from "@/lib/api/products"
import * as contentApi from "@/lib/api/content"
import * as promotionsApi from "@/lib/api/promotions"
import { minorToRupees } from "@/lib/api/config"
import { RecentlyViewedStrip } from "@/components/product/recently-viewed-strip"
import type { ProductDto, ContentItemDto, CouponDto } from "@/lib/api/types"

/* ─── helpers ─────────────────────────────────────────────────── */

function mapProduct(node: ProductDto) {
  const v = node.variants[0]
  return {
    _id: node.id,
    name: node.title,
    slug: node.slug,
    description: node.descriptionHtml ?? "",
    price: v ? minorToRupees(v.priceMinor) : 0,
    originalPrice: v?.compareAtMinor ? minorToRupees(v.compareAtMinor) : undefined,
    images: node.images ?? [],
    category: node.categoryId ?? "",
    rating: Number(node.ratingAvg ?? 0),
    sold: node.ratingCount ?? 0,
    featured: node.tags?.includes("featured") ?? false,
    recommended: node.tags?.includes("recommended") ?? false,
    createdAt: node.createdAt,
    stock: v?.inStock ? 100 : 0,
    variants: node.variants,
    brandId: node.brandId,
  }
}

type HP = ReturnType<typeof mapProduct>

const CATEGORY_EMOJI: Record<string, string> = {
  men: "👕", women: "👗", "t-shirts": "👕", tshirts: "👕", hoodies: "🧥",
  accessories: "👒", "mobile covers": "📱", mobile: "📱", footwear: "👟",
  shoes: "👟", bags: "👜", caps: "🧢", joggers: "👖", jeans: "👖",
  kurta: "🥻", ethnic: "🥻", watches: "⌚", sunglasses: "🕶️",
}
const CATEGORY_BG = [
  "bg-pink-50", "bg-blue-50", "bg-orange-50",
  "bg-green-50", "bg-purple-50", "bg-orange-50",
]
const HERO_SLIDES = [
  {
    gradient: "from-gray-900 via-gray-800 to-gray-900",
    accent: "text-[#F38508]",
    tag: "NEW COLLECTION",
    headline: "Style That\nSpeaks Louder",
    sub: "Oversized fits, bold graphics & more",
    cta: "Shop Men",
    link: "/products?category=Men",
    badge: "UP TO 50% OFF",
    badgeColor: "bg-[#F38508] text-black",
  },
  {
    gradient: "from-rose-600 via-pink-600 to-fuchsia-700",
    accent: "text-white",
    tag: "WOMEN'S EDIT",
    headline: "Wear Your\nConfidence",
    sub: "Trending silhouettes for every occasion",
    cta: "Shop Women",
    link: "/products?category=Women",
    badge: "FREE DELIVERY",
    badgeColor: "bg-white text-pink-600",
  },
  {
    gradient: "from-[#F38508] via-orange-400 to-orange-500",
    accent: "text-gray-900",
    tag: "FLASH DEALS",
    headline: "Unbeatable\nPrices Today",
    sub: "Limited-time offers on fan favourites",
    cta: "Explore Deals",
    link: "/products?sort=trending",
    badge: "ENDS TONIGHT",
    badgeColor: "bg-gray-900 text-[#F38508]",
  },
]

/* ─── component ────────────────────────────────────────────────── */

export default function HomePage() {
  const [products, setProducts] = useState<HP[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [banners, setBanners] = useState<ContentItemDto[]>([])
  const [coupons, setCoupons] = useState<CouponDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [heroSlide, setHeroSlide] = useState(0)

  // Flash sale countdown
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    void fetchHomeData()

    const midnight = new Date()
    midnight.setHours(23, 59, 59, 999)
    const tick = () => {
      const diff = midnight.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft({ hours: 0, minutes: 0, seconds: 0 }); return }
      setTimeLeft({
        hours: Math.floor(diff / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1000),
      })
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-advance hero
  useEffect(() => {
    const t = setInterval(() => setHeroSlide((s) => (s + 1) % HERO_SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])

  const fetchHomeData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [conn, cats, bans, cpns] = await Promise.all([
        productsApi.listProducts({ first: 60, status: "published" }),
        productsApi.listCategories(),
        contentApi.banners(),
        promotionsApi.publicCoupons(8),
      ])
      setProducts(conn.edges.map((e) => mapProduct(e.node)))
      setCategories(cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug })))
      setBanners(bans)
      setCoupons(cpns.filter((c) => c.isActive))
    } catch (err) {
      console.error(err)
      setError("Failed to load content. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  // Derived product lists
  const newArrivals = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12)
  const trending = [...products].sort((a, b) => b.sold - a.sold).slice(0, 12)
  const flashSale = products.filter((p) => p.originalPrice && p.originalPrice > p.price).slice(0, 12)
  const featured = products.filter((p) => p.featured).slice(0, 12)
  const recommended = products.filter((p) => p.recommended || Number(p.rating) >= 4).slice(0, 12)

  if (error && !loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchHomeData}>Try Again</Button>
        </div>
      </div>
    )
  }

  const slide = HERO_SLIDES[heroSlide]!

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* ── 1. Hero Carousel ─────────────────────────────────────── */}
      {banners.length > 0 && banners[0]?.imageUrl ? (
        /* Real banners from backend */
        <div className="w-full">
          <Carousel opts={{ align: "center", loop: true }} className="w-full max-w-[1400px] mx-auto relative px-4 pt-2 pb-6">
            <CarouselContent>
              {banners.map((b) => (
                <CarouselItem key={b.id} className="basis-10/12 md:basis-1/2 lg:basis-1/3 p-2 pl-4">
                  <Link
                    href={b.ctaUrl || "#"}
                    className="block relative aspect-[4/5] md:aspect-square overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-shadow group"
                  >
                    <Image
                      src={b.imageUrl!}
                      alt={b.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col items-start justify-end p-6">
                      <h3 className="text-white text-xl md:text-2xl font-bold uppercase tracking-wider">{b.title}</h3>
                      {b.excerpt && <p className="text-white/80 text-sm mt-1">{b.excerpt}</p>}
                      {b.ctaText && (
                        <span className="mt-3 text-xs font-semibold text-white bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                          {b.ctaText}
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
      ) : (
        /* Gradient hero slides (fallback when no banner images) */
        <div className={`relative w-full bg-gradient-to-br ${slide.gradient} transition-all duration-700`}>
          <div className="container mx-auto px-4 py-14 md:py-20 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-white">
              <span className={`text-xs font-bold tracking-[0.2em] ${slide.accent} uppercase mb-3 block`}>{slide.tag}</span>
              <h1 className={`text-4xl md:text-6xl font-black uppercase leading-none tracking-tighter whitespace-pre-line ${slide.accent}`}>
                {slide.headline}
              </h1>
              <p className={`mt-4 text-base md:text-lg ${slide.gradient.includes("from-[#F38508]") ? "text-gray-800" : "text-white/80"}`}>
                {slide.sub}
              </p>
              <div className="mt-6 flex items-center gap-4 flex-wrap">
                <Link href={slide.link}>
                  <Button size="lg" className={`font-bold px-8 ${slide.gradient.includes("from-[#F38508]") ? "bg-gray-900 text-white hover:bg-black" : "bg-[#F38508] text-black hover:bg-[#D97706]"}`}>
                    {slide.cta} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${slide.badgeColor}`}>{slide.badge}</span>
              </div>
            </div>
            {/* Slide dots */}
          </div>
          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroSlide(i)}
                className={`h-2 rounded-full transition-all ${i === heroSlide ? "w-6 bg-[#F38508]" : "w-2 bg-white/40"}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 2. Trust badges ────────────────────────────────────────── */}
      <div className="bg-[#111827] py-2.5 border-b">
        <div className="container mx-auto px-4 flex items-center justify-around gap-3 text-white text-xs font-semibold uppercase tracking-wide flex-wrap">
          <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-[#F38508]" /> Fast Delivery</span>
          <span className="flex items-center gap-1.5"><RefreshCcw className="w-4 h-4 text-[#F38508]" /> 7-Day Returns</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#F38508]" /> Secure Payments</span>
          <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-[#F38508]" /> 100% Genuine</span>
        </div>
      </div>

      {/* ── 3. Categories ────────────────────────────────────────── */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-header text-lg md:text-2xl font-black text-[#111827] uppercase tracking-wide">Shop By Category</h2>
            <Link href="/products" className="text-xs font-semibold text-[#F38508] flex items-center gap-1 hover:underline">
              All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.slice(0, 6).map((cat, i) => {
                const emoji = CATEGORY_EMOJI[cat.name.toLowerCase()] ?? "🛍️"
                const bg = CATEGORY_BG[i % CATEGORY_BG.length]!
                return (
                  <Link
                    key={cat.id}
                    href={`/products?categoryId=${cat.id}`}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div className={`w-full aspect-square ${bg} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform text-4xl md:text-5xl shadow-sm`}>
                      {emoji}
                    </div>
                    <span className="text-xs md:text-sm font-bold text-gray-700 text-center uppercase tracking-wide group-hover:text-black">
                      {cat.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Flash Sale ────────────────────────────────────────── */}
      {(loading || flashSale.length > 0) && (
        <section className="py-8 md:py-12 bg-gradient-to-r from-red-600 to-orange-500">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-[#F38508] animate-pulse" />
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wide">Flash Sale</h2>
              </div>
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <Clock className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-sm">Ends in:</span>
                {(["hours", "minutes", "seconds"] as const).map((u, i) => (
                  <span key={u} className="flex items-center gap-1">
                    <span className="bg-white text-red-600 font-black px-2 py-1 rounded text-lg min-w-[40px] text-center tabular-nums">
                      {String(timeLeft[u]).padStart(2, "0")}
                    </span>
                    {i < 2 && <span className="text-white text-lg font-bold">:</span>}
                  </span>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-[160px] md:w-[220px] h-[300px] flex-shrink-0 rounded-lg bg-white/20" />)}
              </div>
            ) : (
              <Carousel opts={{ align: "start", dragFree: true }}>
                <CarouselContent className="-ml-3">
                  {flashSale.map((p) => (
                    <CarouselItem key={p._id} className="pl-3 basis-[48%] md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                      <div className="relative">
                        <Badge className="absolute top-2 left-2 z-10 bg-[#F38508] text-black font-black text-xs">
                          {Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)}% OFF
                        </Badge>
                        <ProductCard product={p} />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-4 bg-white" />
                <CarouselNext className="hidden md:flex -right-4 bg-white" />
              </Carousel>
            )}
          </div>
        </section>
      )}

      {/* ── 5. New Arrivals ──────────────────────────────────────── */}
      <ProductSlider title="New Arrivals" products={newArrivals} link="/products?sort=newest" loading={loading} />

      {/* ── 6. Mid-banner strip ──────────────────────────────────── */}
      {!loading && (
        <div className="py-4 md:py-6 container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/products?category=Men" className="group relative h-36 md:h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center px-8">
              <div>
                <p className="text-[#F38508] text-xs font-bold uppercase tracking-widest mb-1">For Him</p>
                <h3 className="text-white text-2xl font-black uppercase leading-tight">Men's<br />Collection</h3>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-white/70 group-hover:text-[#F38508] transition-colors font-semibold">
                  Shop Now <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <span className="absolute right-6 text-7xl opacity-20 group-hover:opacity-30 transition-opacity">👕</span>
            </Link>
            <Link href="/products?category=Women" className="group relative h-36 md:h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-600 to-rose-700 flex items-center px-8">
              <div>
                <p className="text-[#F38508]/80 text-xs font-bold uppercase tracking-widest mb-1">For Her</p>
                <h3 className="text-white text-2xl font-black uppercase leading-tight">Women's<br />Edit</h3>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-white/70 group-hover:text-[#F38508] transition-colors font-semibold">
                  Shop Now <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <span className="absolute right-6 text-7xl opacity-20 group-hover:opacity-30 transition-opacity">👗</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── 7. Trending Now ──────────────────────────────────────── */}
      <ProductSlider title="Trending Now" products={trending} link="/products?sort=trending" loading={loading} />

      {/* ── 8. Offers / Coupons ──────────────────────────────────── */}
      {(loading || coupons.length > 0) && (
        <section className="py-8 md:py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Gift className="w-6 h-6 text-[#F38508]" />
                <h2 className="section-header text-lg md:text-2xl font-black text-[#111827] uppercase tracking-wide">Offers &amp; Coupons</h2>
              </div>
              <Link href="/offers" className="text-xs font-semibold text-[#F38508] hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {coupons.slice(0, 8).map((c) => {
                  const discountLabel =
                    c.type === "percentage" ? `${(c.percentBps! / 100).toFixed(0)}% OFF`
                    : c.type === "fixed_amount" ? `₹${minorToRupees(c.valueMinor!).toFixed(0)} OFF`
                    : c.type === "free_shipping" ? "FREE SHIP"
                    : "DEAL"
                  const minOrder = c.minOrderMinor ? `Min ₹${minorToRupees(c.minOrderMinor).toFixed(0)}` : null
                  return (
                    <div
                      key={c.id}
                      className="bg-gradient-to-br from-orange-50 to-orange-50 rounded-xl border-2 border-dashed border-[#F38508]/40 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2">
                        {c.type === "percentage" ? <Percent className="w-5 h-5 text-orange-500" /> : <Tag className="w-5 h-5 text-orange-500" />}
                        <span className="text-2xl font-black text-orange-600">{discountLabel}</span>
                      </div>
                      <div className="bg-white rounded-lg px-3 py-1.5 flex items-center justify-between border border-orange-200">
                        <span className="text-xs text-gray-500 font-medium">Code:</span>
                        <span className="font-black text-gray-900 text-sm tracking-widest">{c.code}</span>
                      </div>
                      {minOrder && <p className="text-[11px] text-gray-400">{minOrder}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 9. Recommended For You ───────────────────────────────── */}
      {(loading || recommended.length > 0) && (
        <section className="py-8 md:py-12 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="w-6 h-6 text-[#F38508] fill-orange-100" />
              <h2 className="section-header text-lg md:text-2xl font-black text-[#111827] uppercase tracking-wide">Recommended For You</h2>
            </div>
            {loading ? (
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-[160px] md:w-[220px] h-[300px] flex-shrink-0 rounded-lg" />)}
              </div>
            ) : (
              <Carousel opts={{ align: "start", dragFree: true }}>
                <CarouselContent className="-ml-3">
                  {recommended.map((p) => (
                    <CarouselItem key={p._id} className="pl-3 basis-[48%] md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                      <ProductCard product={p} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-4" />
                <CarouselNext className="hidden md:flex -right-4" />
              </Carousel>
            )}
          </div>
        </section>
      )}

      {/* ── 10. Featured Products ────────────────────────────────── */}
      {featured.length > 0 && <ProductSlider title="Featured" products={featured} link="/products?featured=true" loading={false} />}

      {/* ── 11. Recently Viewed ──────────────────────────────────── */}
      <section className="py-8 md:py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <RecentlyViewedStrip />
        </div>
      </section>

      {/* ── 12. App Download Banner — Navy bg like Robu.in ────────────────── */}
      <section className="py-8 bg-[#111827]">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-white uppercase">Get the App</h3>
            <p className="text-gray-400 text-sm mt-1">Shop on the go — exclusive app-only deals every day</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/apps" className="flex items-center gap-2 bg-white text-gray-900 px-5 py-3 rounded-xl font-bold text-sm hover:bg-[#F38508] transition-colors">
              <span className="text-xl">🍎</span> App Store
            </Link>
            <Link href="/apps" className="flex items-center gap-2 bg-white text-gray-900 px-5 py-3 rounded-xl font-bold text-sm hover:bg-[#F38508] transition-colors">
              <span className="text-xl">🤖</span> Google Play
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

/* ─── sub-components ────────────────────────────────────────────── */

function ProductSlider({ title, products, link, loading }: { title: string; products: HP[]; link?: string; loading: boolean }) {
  if (!loading && products.length === 0) return null
  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-2xl font-black text-[#111827] uppercase tracking-wide">{title}</h2>
          {link && (
            <Link href={link} className="text-xs md:text-sm font-semibold text-[#F38508] hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-[160px] md:w-[220px] h-[300px] flex-shrink-0 rounded-lg" />)}
          </div>
        ) : (
          <Carousel opts={{ align: "start", dragFree: true }}>
            <CarouselContent className="-ml-3">
              {products.map((p) => (
                <CarouselItem key={p._id} className="pl-3 basis-[48%] md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                  <ProductCard product={p} />
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
}
