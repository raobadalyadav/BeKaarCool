"use client"

import { useState, useEffect, useRef } from "react"
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
  Truck,
  RefreshCcw,
  ShieldCheck,
  Star,
  AlertCircle,
  Clock,
  Zap,
  Heart,
  ArrowRight,
} from "lucide-react"
import * as productsApi from "@/lib/api/products"
import * as contentApi from "@/lib/api/content"
import * as promotionsApi from "@/lib/api/promotions"
import { minorToRupees } from "@/lib/api/config"
import { RecentlyViewedStrip } from "@/components/product/recently-viewed-strip"
import { useToast } from "@/hooks/use-toast"
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

const CATEGORY_COLORS = [
  "from-pink-100 to-rose-100 ring-pink-300",
  "from-blue-100 to-indigo-100 ring-blue-300",
  "from-amber-100 to-orange-100 ring-amber-300",
  "from-green-100 to-emerald-100 ring-green-300",
  "from-purple-100 to-violet-100 ring-purple-300",
  "from-teal-100 to-cyan-100 ring-teal-300",
  "from-red-100 to-pink-100 ring-red-300",
  "from-yellow-100 to-amber-100 ring-yellow-300",
]
const CATEGORY_EMOJI: Record<string, string> = {
  men: "👕", women: "👗", "t-shirts": "👕", tshirts: "👕", hoodies: "🧥",
  accessories: "👒", "mobile covers": "📱", mobile: "📱", footwear: "👟",
  shoes: "👟", bags: "👜", caps: "🧢", joggers: "👖", jeans: "👖",
  kurta: "🥻", ethnic: "🥻", watches: "⌚", sunglasses: "🕶️",
}

const HERO_SLIDES = [
  {
    gradient: "from-gray-900 via-gray-800 to-gray-900",
    tag: "NEW COLLECTION",
    headline: "Style That\nSpeaks Louder",
    sub: "Oversized fits, bold graphics & more",
    cta: "Shop Men",
    link: "/products?category=Men",
    badge: "UP TO 50% OFF",
    emoji: "👕",
  },
  {
    gradient: "from-rose-600 via-pink-600 to-fuchsia-700",
    tag: "WOMEN'S EDIT",
    headline: "Wear Your\nConfidence",
    sub: "Trending silhouettes for every occasion",
    cta: "Shop Women",
    link: "/products?category=Women",
    badge: "FREE DELIVERY",
    emoji: "👗",
  },
  {
    gradient: "from-[#F38508] via-orange-500 to-amber-500",
    tag: "FLASH DEALS",
    headline: "Unbeatable\nPrices Today",
    sub: "Limited-time offers on fan favourites",
    cta: "Explore Deals",
    link: "/products?sort=trending",
    badge: "ENDS TONIGHT",
    emoji: "⚡",
  },
]

/* ─── Section header component ─────────────────────────────────── */
function SectionHeader({ title, link }: { title: string; link?: string }) {
  return (
    <div className="flex items-center justify-between mb-5 md:mb-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-[#F38508] rounded-full flex-shrink-0" />
        <h2 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-wide">{title}</h2>
      </div>
      {link && (
        <Link href={link} className="text-xs font-semibold text-[#F38508] hover:underline flex items-center gap-0.5">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  )
}

/* ─── Product slider sub-component ─────────────────────────────── */
function ProductSlider({ title, products, link, loading, bg = "bg-white" }: {
  title: string; products: HP[]; link?: string; loading: boolean; bg?: string
}) {
  if (!loading && products.length === 0) return null
  return (
    <section className={`py-8 md:py-10 ${bg}`}>
      <div className="container mx-auto px-4">
        <SectionHeader title={title} link={link} />
        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-[160px] md:w-[200px] h-[280px] flex-shrink-0 rounded-xl" />
            ))}
          </div>
        ) : (
          <Carousel opts={{ align: "start", dragFree: true }}>
            <CarouselContent className="-ml-3">
              {products.map((p) => (
                <CarouselItem key={p._id} className="pl-3 basis-[47%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-[16.66%]">
                  <ProductCard product={p} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4 bg-white shadow-md border" />
            <CarouselNext className="hidden md:flex -right-4 bg-white shadow-md border" />
          </Carousel>
        )}
      </div>
    </section>
  )
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function HomePage() {
  const [products, setProducts] = useState<HP[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [banners, setBanners] = useState<ContentItemDto[]>([])
  const [coupons, setCoupons] = useState<CouponDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [heroSlide, setHeroSlide] = useState(0)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const fetchedRef = useRef(false)
  const { toast } = useToast()

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

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      toast({ title: `Code "${code}" copied!`, description: "Paste it at checkout." })
      setTimeout(() => setCopiedCode(null), 2500)
    } catch {
      toast({ title: "Copy failed", description: "Please copy the code manually.", variant: "destructive" })
    }
  }

  const newArrivals = [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 12)
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
    <div className="min-h-screen bg-gray-50">

      {/* ── 1. Hero — full-width slider ──────────────────────── */}
      {banners.length > 0 && banners[0]?.imageUrl ? (
        <div className="relative w-full overflow-hidden bg-gray-900">
          <Carousel opts={{ align: "center", loop: true }} className="w-full">
            <CarouselContent>
              {banners.map((b) => (
                <CarouselItem key={b.id} className="basis-full">
                  <Link href={b.ctaUrl || "#"} className="block relative w-full aspect-[21/8] md:aspect-[16/5] overflow-hidden">
                    <Image src={b.imageUrl!} alt={b.title} fill className="object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex flex-col justify-center px-8 md:px-16">
                      <h2 className="text-white text-2xl md:text-4xl font-black uppercase leading-tight tracking-tight max-w-lg">
                        {b.title}
                      </h2>
                      {b.excerpt && <p className="text-white/80 text-sm md:text-base mt-2 max-w-sm">{b.excerpt}</p>}
                      {b.ctaText && (
                        <span className="mt-4 inline-block text-sm font-bold text-black bg-[#F38508] px-6 py-2.5 rounded-full w-fit hover:bg-[#D97706] transition-colors">
                          {b.ctaText}
                        </span>
                      )}
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 z-10 bg-white/80 hover:bg-white border-0 shadow-lg" />
            <CarouselNext className="right-4 z-10 bg-white/80 hover:bg-white border-0 shadow-lg" />
          </Carousel>
        </div>
      ) : (
        /* Fallback gradient hero — full width */
        <div className={`relative w-full bg-gradient-to-br ${slide.gradient} transition-all duration-700 overflow-hidden`}>
          <div className="container mx-auto px-4 py-12 md:py-20 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 text-white">
              <span className="text-xs font-bold tracking-[0.25em] text-[#F38508] uppercase mb-3 block">{slide.tag}</span>
              <h1 className="text-4xl md:text-6xl font-black uppercase leading-none tracking-tighter whitespace-pre-line text-white">
                {slide.headline}
              </h1>
              <p className="mt-4 text-sm md:text-base text-white/80">{slide.sub}</p>
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <Link href={slide.link}>
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-[#F38508] hover:text-black font-bold px-7 transition-colors">
                    {slide.cta} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-black/30 text-white backdrop-blur-sm">
                  {slide.badge}
                </span>
              </div>
            </div>
            <div className="text-[120px] md:text-[180px] opacity-20 select-none leading-none">
              {slide.emoji}
            </div>
          </div>
          {/* Slide dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === heroSlide ? "w-8 bg-[#F38508]" : "w-2 bg-white/40"}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 2. Trust bar — clean white ───────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-2.5">
          <div className="flex items-center justify-around gap-2 text-gray-600 text-[11px] font-semibold uppercase tracking-wide flex-wrap">
            <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-[#F38508]" /> Fast Delivery</span>
            <span className="hidden sm:flex items-center gap-1.5 text-gray-200">|</span>
            <span className="flex items-center gap-1.5"><RefreshCcw className="w-3.5 h-3.5 text-[#F38508]" /> 7-Day Returns</span>
            <span className="hidden sm:flex items-center gap-1.5 text-gray-200">|</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#F38508]" /> Secure Payments</span>
            <span className="hidden sm:flex items-center gap-1.5 text-gray-200">|</span>
            <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-[#F38508]" /> 100% Genuine</span>
          </div>
        </div>
      </div>

      {/* ── 3. Categories — circles ──────────────────────────── */}
      <section className="py-8 md:py-10 bg-white">
        <div className="container mx-auto px-4">
          <SectionHeader title="Shop By Category" link="/products" />
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                  <Skeleton className="w-16 h-16 md:w-20 md:h-20 rounded-full" />
                  <Skeleton className="w-14 h-3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-8 md:overflow-visible">
              {categories.slice(0, 12).map((cat, i) => {
                const emoji = CATEGORY_EMOJI[cat.name.toLowerCase()] ?? "🛍️"
                const colors = CATEGORY_COLORS[i % CATEGORY_COLORS.length]!
                return (
                  <Link
                    key={cat.id}
                    href={`/products?categoryId=${cat.id}`}
                    className="flex flex-col items-center gap-2 group flex-shrink-0 md:flex-shrink"
                  >
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${colors.split(" ").slice(0, 2).join(" ")} flex items-center justify-center text-2xl md:text-3xl ring-2 ring-transparent group-hover:ring-[#F38508] transition-all duration-200 group-hover:scale-105 shadow-sm`}>
                      {emoji}
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-gray-600 text-center uppercase tracking-wide group-hover:text-[#F38508] transition-colors whitespace-nowrap">
                      {cat.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Flash Sale ───────────────────────────────────── */}
      {(loading || flashSale.length > 0) && (
        <section className="py-8 md:py-10 bg-gradient-to-r from-red-600 to-orange-500">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-300 animate-pulse" />
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide">Flash Sale</h2>
              </div>
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-white text-xs font-semibold">Ends in:</span>
                {(["hours", "minutes", "seconds"] as const).map((u, i) => (
                  <span key={u} className="flex items-center gap-0.5">
                    <span className="bg-white text-red-600 font-black px-2 py-0.5 rounded text-sm min-w-[32px] text-center tabular-nums">
                      {String(timeLeft[u]).padStart(2, "0")}
                    </span>
                    {i < 2 && <span className="text-white font-bold">:</span>}
                  </span>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-[160px] h-[280px] flex-shrink-0 rounded-xl bg-white/20" />)}
              </div>
            ) : (
              <Carousel opts={{ align: "start", dragFree: true }}>
                <CarouselContent className="-ml-3">
                  {flashSale.map((p) => (
                    <CarouselItem key={p._id} className="pl-3 basis-[47%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-[16.66%]">
                      <div className="relative">
                        <Badge className="absolute top-2 left-2 z-10 bg-red-600 text-white font-black text-[10px] shadow">
                          {Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)}% OFF
                        </Badge>
                        <ProductCard product={p} />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-4 bg-white shadow-lg border-0" />
                <CarouselNext className="hidden md:flex -right-4 bg-white shadow-lg border-0" />
              </Carousel>
            )}
          </div>
        </section>
      )}

      {/* ── 5. New Arrivals ──────────────────────────────────── */}
      <ProductSlider title="New Arrivals" products={newArrivals} link="/products?sort=newest" loading={loading} />

      {/* ── 6. Mid-banner strip ──────────────────────────────── */}
      {!loading && (
        <div className="py-4 md:py-6 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/products?category=Men"
                className="group relative h-36 md:h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-700" />
                <div className="absolute inset-0 flex flex-col justify-center px-8">
                  <p className="text-[#F38508] text-xs font-bold uppercase tracking-widest mb-1">For Him</p>
                  <h3 className="text-white text-2xl md:text-3xl font-black uppercase leading-tight">
                    Men's<br />Collection
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-white/70 group-hover:text-[#F38508] transition-colors font-semibold">
                    Shop Now <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-8xl opacity-10 group-hover:opacity-20 transition-opacity select-none">👕</span>
              </Link>
              <Link
                href="/products?category=Women"
                className="group relative h-36 md:h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-600 to-rose-700" />
                <div className="absolute inset-0 flex flex-col justify-center px-8">
                  <p className="text-orange-200 text-xs font-bold uppercase tracking-widest mb-1">For Her</p>
                  <h3 className="text-white text-2xl md:text-3xl font-black uppercase leading-tight">
                    Women's<br />Edit
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-white/70 group-hover:text-orange-200 transition-colors font-semibold">
                    Shop Now <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-8xl opacity-10 group-hover:opacity-20 transition-opacity select-none">👗</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Trending Now ──────────────────────────────────── */}
      <ProductSlider title="Trending Now" products={trending} link="/products?sort=trending" loading={loading} bg="bg-gray-50" />

      {/* ── 9. Recommended For You ───────────────────────────── */}
      {(loading || recommended.length > 0) && (
        <section className="py-8 md:py-10 bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#F38508] rounded-full flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#F38508]" />
                  <h2 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-wide">Recommended For You</h2>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-[160px] h-[280px] flex-shrink-0 rounded-xl" />)}
              </div>
            ) : (
              <Carousel opts={{ align: "start", dragFree: true }}>
                <CarouselContent className="-ml-3">
                  {recommended.map((p) => (
                    <CarouselItem key={p._id} className="pl-3 basis-[47%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-[16.66%]">
                      <ProductCard product={p} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-4 bg-white shadow-md border" />
                <CarouselNext className="hidden md:flex -right-4 bg-white shadow-md border" />
              </Carousel>
            )}
          </div>
        </section>
      )}

      {/* ── 10. Featured Products ────────────────────────────── */}
      {featured.length > 0 && (
        <ProductSlider title="Featured" products={featured} link="/products?featured=true" loading={false} />
      )}

      {/* ── 11. Recently Viewed ──────────────────────────────── */}
      <section className="py-8 md:py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <RecentlyViewedStrip />
        </div>
      </section>

      {/* ── 12. App download — above footer ──────────────────── */}
      <section className="bg-[#111827] py-8 md:py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide">Get the Baefikra App</h3>
              <p className="text-gray-400 text-sm mt-1">Exclusive app-only deals • Faster checkout • Order tracking</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/apps" className="flex items-center gap-2.5 bg-white text-gray-900 hover:bg-[#F38508] hover:text-black px-5 py-3 rounded-xl font-bold text-sm transition-colors">
                <span className="text-xl">🍎</span> App Store
              </Link>
              <Link href="/apps" className="flex items-center gap-2.5 bg-white text-gray-900 hover:bg-[#F38508] hover:text-black px-5 py-3 rounded-xl font-bold text-sm transition-colors">
                <span className="text-xl">🤖</span> Google Play
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
