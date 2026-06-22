"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductCard } from "@/components/product/product-card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import {
  ChevronRight,
  Truck,
  RefreshCcw,
  ShieldCheck,
  Star,
  AlertCircle,
} from "lucide-react"
import * as productsApi from "@/lib/api/products"
import * as contentApi from "@/lib/api/content"
import { minorToRupees } from "@/lib/api/config"
import { RecentlyViewedStrip } from "@/components/product/recently-viewed-strip"
import { Button } from "@/components/ui/button"
import type { ProductDto, ContentItemDto } from "@/lib/api/types"

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

/* ─── Category circle color palette ─────────────────────────── */
const CAT_PALETTES = [
  { bg: "#FDF4F0", fg: "#9A5E49" },
  { bg: "#FFF8E6", fg: "#8A6820" },
  { bg: "#EFF4FF", fg: "#3B52A0" },
  { bg: "#F0FDF4", fg: "#16653A" },
  { bg: "#FDF0F8", fg: "#9D174D" },
  { bg: "#F5F0FD", fg: "#6D28D9" },
  { bg: "#FFF0F0", fg: "#991B1B" },
  { bg: "#F0FDFD", fg: "#0E7490" },
]
function catPalette(name: string) {
  const h = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return CAT_PALETTES[h % CAT_PALETTES.length]
}

/* ─── Section header — GIVA style ───────────────────────────── */
function SectionHeader({
  title,
  eyebrow,
  link,
}: {
  title: string
  eyebrow?: string
  link?: string
}) {
  return (
    <div className="flex items-end justify-between mb-10 md:mb-12">
      <div>
        {eyebrow && (
          <p className="text-brand-500 text-[11px] font-bold uppercase tracking-[0.25em] mb-2">
            {eyebrow}
          </p>
        )}
        <h2 className="font-heading text-[26px] md:text-[34px] font-bold text-gray-900 leading-tight tracking-tight">
          {title}
        </h2>
        <div className="mt-3 h-[3px] w-10 bg-brand-500 rounded-full" />
      </div>
      {link && (
        <Link
          href={link}
          className="flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 hover:text-brand-500 transition-colors mb-1"
        >
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  )
}

/* ─── Product carousel section ───────────────────────────────── */
function ProductSection({
  title,
  eyebrow,
  products,
  link,
  loading,
  bg = "bg-[#FAF8F6]",
}: {
  title: string
  eyebrow?: string
  products: HP[]
  link?: string
  loading: boolean
  bg?: string
}) {
  if (!loading && products.length === 0) return null
  return (
    <section className={`py-14 md:py-20 ${bg}`}>
      <div className="container">
        <SectionHeader title={title} eyebrow={eyebrow} link={link} />
        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-[160px] md:w-[210px] h-[300px] flex-shrink-0 rounded-xl" />
            ))}
          </div>
        ) : (
          <Carousel opts={{ align: "start", dragFree: true }}>
            <CarouselContent className="-ml-4">
              {products.map((p) => (
                <CarouselItem
                  key={p._id}
                  className="pl-4 basis-[48%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                >
                  <ProductCard product={p} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-5 bg-white border border-gray-200 hover:border-brand-500 shadow-sm" />
            <CarouselNext className="hidden md:flex -right-5 bg-white border border-gray-200 hover:border-brand-500 shadow-sm" />
          </Carousel>
        )}
      </div>
    </section>
  )
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function HomePage() {
  const [products, setProducts] = useState<HP[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [banners, setBanners] = useState<ContentItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [heroApi, setHeroApi] = useState<CarouselApi>()
  const [activeSlide, setActiveSlide] = useState(0)

  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    void fetchHomeData()
  }, [])

  useEffect(() => {
    if (!heroApi) return
    setActiveSlide(heroApi.selectedScrollSnap())
    heroApi.on("select", () => setActiveSlide(heroApi.selectedScrollSnap()))
  }, [heroApi])

  const fetchHomeData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [conn, cats, bans] = await Promise.all([
        productsApi.listProducts({ first: 60, status: "published" }),
        productsApi.listCategories(),
        contentApi.banners(),
      ])
      setProducts(conn.edges.map((e) => mapProduct(e.node)))
      setCategories(cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug })))
      setBanners(bans)
    } catch (err) {
      console.error(err)
      setError("Failed to load content. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  const newArrivals = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12)
  const trending = [...products].sort((a, b) => b.sold - a.sold).slice(0, 12)
  const featured = products.filter((p) => p.featured || Number(p.rating) >= 4).slice(0, 8)

  if (error && !loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F6]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchHomeData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F6]">

      {/* ── 1. Hero carousel with dot navigation ─────────────── */}
      {loading ? (
        <Skeleton className="w-full aspect-[21/8] md:aspect-[16/5]" />
      ) : banners.length > 0 && banners[0]?.imageUrl ? (
        <div className="relative w-full bg-gray-100">
          <Carousel
            opts={{ align: "center", loop: true }}
            setApi={setHeroApi}
            className="w-full"
          >
            <CarouselContent>
              {banners.map((b) => (
                <CarouselItem key={b.id} className="basis-full">
                  <Link
                    href={b.ctaUrl || "#"}
                    className="block relative w-full aspect-[21/8] md:aspect-[16/5] overflow-hidden"
                  >
                    <Image
                      src={b.imageUrl!}
                      alt={b.title}
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20">
                      <p className="text-white/60 text-[11px] font-semibold uppercase tracking-[0.25em] mb-3">
                        New Collection
                      </p>
                      <h2 className="font-heading text-white text-3xl md:text-6xl font-bold leading-tight tracking-tight max-w-xl">
                        {b.title}
                      </h2>
                      {b.excerpt && (
                        <p className="text-white/75 text-sm md:text-base mt-3 max-w-sm leading-relaxed">
                          {b.excerpt}
                        </p>
                      )}
                      {b.ctaText && (
                        <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold bg-brand-500 text-white px-8 py-3.5 rounded-full w-fit hover:bg-brand-600 transition-colors">
                          {b.ctaText} <ChevronRight className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            {banners.length > 1 && (
              <>
                <CarouselPrevious className="left-4 md:left-6 bg-white/20 hover:bg-white/40 border-0 text-white backdrop-blur-sm" />
                <CarouselNext className="right-4 md:right-6 bg-white/20 hover:bg-white/40 border-0 text-white backdrop-blur-sm" />
              </>
            )}
          </Carousel>

          {/* Dot indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => heroApi?.scrollTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeSlide
                      ? "w-6 h-2 bg-white"
                      : "w-2 h-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* ── 2. Trust bar ─────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E7E5E4]">
        <div className="container py-3.5">
          <div className="flex items-center justify-around text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex-wrap gap-3">
            <span className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
              Free Delivery ₹499+
            </span>
            <span className="hidden sm:block text-gray-200">|</span>
            <span className="flex items-center gap-2">
              <RefreshCcw className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
              7-Day Returns
            </span>
            <span className="hidden sm:block text-gray-200">|</span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
              Secure Payments
            </span>
            <span className="hidden sm:block text-gray-200">|</span>
            <span className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
              100% Genuine
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Category circles — GIVA style ─────────────────── */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container">
          <div className="text-center mb-9">
            <p className="text-brand-500 text-[11px] font-bold uppercase tracking-[0.25em] mb-2">Browse</p>
            <h2 className="font-heading text-[26px] md:text-[32px] font-bold text-gray-900 tracking-tight">
              Shop by Category
            </h2>
          </div>

          <div className="flex gap-5 md:gap-8 overflow-x-auto pb-2 scrollbar-hide md:justify-center">
            {/* All Products */}
            <Link href="/products" className="flex-shrink-0 flex flex-col items-center gap-3 group">
              <div
                className="w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-full flex items-center justify-center border-2 border-transparent group-hover:border-brand-500 transition-all duration-200 shadow-sm"
                style={{ backgroundColor: "#F0F0F0" }}
              >
                <span className="font-heading text-2xl md:text-3xl font-bold text-gray-500">✦</span>
              </div>
              <p className="text-[11px] md:text-xs font-semibold text-gray-600 group-hover:text-brand-500 transition-colors text-center leading-tight max-w-[72px]">
                All
              </p>
            </Link>

            {loading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center gap-3">
                    <Skeleton className="w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-full" />
                    <Skeleton className="h-3 w-14 rounded" />
                  </div>
                ))
              : categories.slice(0, 10).map((cat) => {
                  const { bg, fg } = catPalette(cat.name)
                  return (
                    <Link
                      key={cat.id}
                      href={`/products?categoryId=${cat.id}`}
                      className="flex-shrink-0 flex flex-col items-center gap-3 group"
                    >
                      <div
                        className="w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-full flex items-center justify-center border-2 border-transparent group-hover:border-brand-500 transition-all duration-200 shadow-sm"
                        style={{ backgroundColor: bg }}
                      >
                        <span
                          className="font-heading text-2xl md:text-3xl font-bold"
                          style={{ color: fg }}
                        >
                          {cat.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] md:text-xs font-semibold text-gray-600 group-hover:text-brand-500 transition-colors text-center leading-tight max-w-[72px]">
                        {cat.name}
                      </p>
                    </Link>
                  )
                })}
          </div>
        </div>
      </section>

      {/* ── 4. New Arrivals ──────────────────────────────────── */}
      <ProductSection
        title="New Arrivals"
        eyebrow="Just Landed"
        products={newArrivals}
        link="/products?sort=newest"
        loading={loading}
      />

      {/* ── 5. Men's & Women's editorial banners ─────────────── */}
      {!loading && (
        <section className="pb-14 md:pb-20 bg-[#FAF8F6]">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

              {/* Men's */}
              <Link
                href="/products?category=Men"
                className="group relative overflow-hidden rounded-2xl"
                style={{ aspectRatio: "4/3" }}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(145deg, #1C1C1E 0%, #2D2D2D 60%, #3D3D3D 100%)" }}
                />
                <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-between">
                  <p className="text-brand-400 text-[11px] font-bold uppercase tracking-[0.25em]">
                    For Him
                  </p>
                  <div>
                    <h3 className="font-heading text-white text-4xl md:text-5xl font-bold leading-none mb-5">
                      Men's<br />Collection
                    </h3>
                    <span className="inline-flex items-center gap-2 text-[13px] font-semibold bg-brand-500 text-white px-6 py-3 rounded-full group-hover:bg-brand-600 transition-colors">
                      Shop Now <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>

              {/* Women's */}
              <Link
                href="/products?category=Women"
                className="group relative overflow-hidden rounded-2xl"
                style={{ aspectRatio: "4/3" }}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(145deg, #C98B74 0%, #B9755D 50%, #9A5E49 100%)" }}
                />
                <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-between">
                  <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.25em]">
                    For Her
                  </p>
                  <div>
                    <h3 className="font-heading text-white text-4xl md:text-5xl font-bold leading-none mb-5">
                      Women's<br />Edit
                    </h3>
                    <span className="inline-flex items-center gap-2 text-[13px] font-semibold bg-white text-gray-900 px-6 py-3 rounded-full group-hover:bg-gray-50 transition-colors">
                      Shop Now <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>

            </div>
          </div>
        </section>
      )}

      {/* ── 6. Trending Now ──────────────────────────────────── */}
      <ProductSection
        title="Trending Now"
        eyebrow="Most Popular"
        products={trending}
        link="/products?sort=trending"
        loading={loading}
        bg="bg-white"
      />

      {/* ── 7. Editor's Picks 4-col grid ─────────────────────── */}
      {(loading || featured.length > 0) && (
        <section className="py-14 md:py-20 bg-[#FAF8F6]">
          <div className="container">
            <SectionHeader
              title="Editor's Picks"
              eyebrow="Curated For You"
              link="/products?featured=true"
            />
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[320px] rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                {featured.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 8. Promo strip ───────────────────────────────────── */}
      <div className="bg-[#1C1C1E] py-10 md:py-14">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-brand-400 text-[11px] font-bold uppercase tracking-[0.25em] mb-2">
                Limited Offer
              </p>
              <h3 className="font-heading text-white text-2xl md:text-3xl font-bold leading-tight">
                Use code <span className="text-brand-400">FIRST10</span> for 10% off
              </h3>
              <p className="text-gray-400 text-sm mt-2">On your first order. No minimum purchase.</p>
            </div>
            <Link
              href="/products"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-brand-500 text-white text-sm font-semibold px-8 py-3.5 rounded-full hover:bg-brand-600 transition-colors"
            >
              Shop Now <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 9. Recently Viewed ───────────────────────────────── */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container">
          <RecentlyViewedStrip />
        </div>
      </section>

    </div>
  )
}
