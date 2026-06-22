"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Star, ShoppingBag, Heart, Truck, Shield, RotateCcw, MapPin, Ruler,
  Loader2, Share2, GitCompare, Facebook, Twitter, MessageCircle, Copy,
  Tag, ChevronDown, ChevronUp, Check, ArrowRight, Package,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ReviewSection } from "@/components/product/review-section"
import { ProductCard } from "@/components/product/product-card"
import { useSession } from "next-auth/react"
import { ReviewSummary } from "@/components/ai/review-summary"
import { FitGuide } from "@/components/product/fit-guide"
import { RingSizeGuide } from "@/components/product/ring-size-guide"
import { DeviceCompatibility } from "@/components/product/device-compatibility"
import {
  Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,
} from "@/components/ui/carousel"
import { useCart } from "@/contexts/cart-context"
import { useWishlist } from "@/hooks/use-wishlist"
import * as checkoutApi from "@/lib/api/checkout"
import * as alertsApi from "@/lib/api/alerts"
import { QnaSection } from "@/components/product/qna-section"
import { RecentlyViewedStrip } from "@/components/product/recently-viewed-strip"
import { useRecentlyViewed } from "@/hooks/use-recently-viewed"
import { aiProductRecommendations } from "@/lib/api/ai"
import type { CouponDto } from "@/lib/api/types"

interface QnaAnswer { id: string; answer: string; isOfficial: boolean; upvotes: number; createdAt: string }
interface QnaQuestion { id: string; question: string; upvotes: number; createdAt: string; answers: QnaAnswer[] }
interface ProductDetailClientProps {
  product: any
  relatedProducts?: any[]
  questions?: QnaQuestion[]
  coupons?: CouponDto[]
}
type MediaType = "image" | "video" | "360"
interface MediaItem { type: MediaType; url: string }

/* ── Color name → hex ─────────────────────────────────────────── */
const COLOR_HEX: Record<string, string> = {
  "black": "#1C1C1E", "jet black": "#1C1C1E", "white": "#FFFFFF", "off white": "#F5F5F0",
  "red": "#DC2626", "crimson": "#DC143C", "maroon": "#7F1D1D",
  "blue": "#2563EB", "navy": "#1E3A8A", "navy blue": "#1E3A8A", "royal blue": "#1D4ED8",
  "sky blue": "#38BDF8", "light blue": "#93C5FD", "denim blue": "#1e40af",
  "green": "#16A34A", "olive": "#4D7C0F", "dark green": "#14532D", "bottle green": "#14532D",
  "yellow": "#EAB308", "mustard": "#CA8A04", "golden": "#D97706",
  "orange": "#EA580C", "peach": "#FBBF24",
  "pink": "#EC4899", "hot pink": "#DB2777", "baby pink": "#FBCFE8", "rose": "#F43F5E",
  "purple": "#7C3AED", "lavender": "#A78BFA", "violet": "#7C3AED",
  "grey": "#6B7280", "gray": "#6B7280", "light grey": "#D1D5DB", "charcoal grey": "#374151",
  "brown": "#78350F", "beige": "#D2B48C", "khaki": "#C3A882",
  "teal": "#0D9488", "cyan": "#06B6D4", "indigo": "#4338CA",
}
function colorHex(name: string) { return COLOR_HEX[name.toLowerCase()] ?? "#9CA3AF" }
function isLightColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

/* ── Coupon helpers ───────────────────────────────────────────── */
function couponLabel(c: CouponDto): string {
  if (c.type === "percentage" && c.percentBps) return `${c.percentBps / 100}% OFF`
  if (c.type === "fixed_amount" && c.valueMinor) return `₹${Number(c.valueMinor) / 100} OFF`
  if (c.type === "free_shipping") return "Free Shipping"
  if (c.type === "bogo") return "Buy 1 Get 1"
  return "Discount"
}
function couponDescription(c: CouponDto): string {
  const parts: string[] = []
  if (c.type === "percentage" && c.percentBps) parts.push(`Get ${c.percentBps / 100}% off`)
  else if (c.type === "fixed_amount" && c.valueMinor) parts.push(`Get flat ₹${Number(c.valueMinor) / 100} off`)
  else if (c.type === "free_shipping") parts.push("Free shipping on this order")
  else if (c.type === "bogo") parts.push("Buy 1 Get 1 free")
  if (c.minOrderMinor) parts.push(`on orders above ₹${Number(c.minOrderMinor) / 100}`)
  return parts.join(" ") || "Apply coupon to get discount"
}

/* ── Rating stars ─────────────────────────────────────────────── */
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} style={{ width: size, height: size }}
          className={s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"} />
      ))}
    </span>
  )
}

/* ── Rating breakdown bars ────────────────────────────────────── */
function RatingBreakdown({ reviews, totalCount, avg }: { reviews: any[]; totalCount: number; avg: number }) {
  const counts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r: any) => Math.round(Number(r.rating)) === s).length,
  }))
  const total = Math.max(totalCount, reviews.length, 1)
  const pct = reviews.length > 0
    ? Math.round((reviews.filter((r: any) => Number(r.rating) >= 4).length / reviews.length) * 100) : 0
  return (
    <div className="flex gap-8 items-start">
      <div className="text-center flex-shrink-0">
        <p className="text-5xl font-bold text-gray-900">{avg.toFixed(1)}</p>
        <StarRating rating={avg} size={14} />
        <p className="text-xs text-gray-500 mt-1">{total} ratings</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {counts.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-gray-600 font-medium text-right">{star}</span>
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
            </div>
            <span className="w-6 text-gray-500">({count})</span>
          </div>
        ))}
      </div>
      {reviews.length > 0 && (
        <div className="hidden md:block text-center flex-shrink-0">
          <p className="text-3xl font-bold text-green-600">{pct}%</p>
          <p className="text-xs text-gray-500 leading-tight mt-1">of verified buyers<br />recommend this</p>
        </div>
      )}
    </div>
  )
}

/* ── Accordion ────────────────────────────────────────────────── */
function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100">
      <button className="w-full flex items-center justify-between py-4 text-left" onClick={() => setOpen((o) => !o)}>
        <span className="font-semibold text-gray-900 text-sm uppercase tracking-wide">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  )
}

/* ── Copy coupon button ───────────────────────────────────────── */
function CouponCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <button onClick={copy}
      className="inline-flex items-center gap-1.5 border border-dashed border-brand-400 rounded px-2.5 py-1 text-xs font-bold text-brand-600 hover:bg-brand-50 transition-colors">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : code}
    </button>
  )
}

/* ── Main component ───────────────────────────────────────────── */
export default function ProductDetailClient({
  product,
  relatedProducts = [],
  questions = [],
  coupons = [],
}: ProductDetailClientProps) {
  const router = useRouter()
  const [selectedMedia, setSelectedMedia] = useState(0)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [pincode, setPincode] = useState("")
  const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [notifySubscribed, setNotifySubscribed] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const { toast } = useToast()
  const { addToCart, clearCart } = useCart()
  const { has: isInWishlist, toggle: toggleWishlist } = useWishlist()
  const { data: session } = useSession()
  const { add: addRecentlyViewed } = useRecentlyViewed()

  useEffect(() => {
    addRecentlyViewed({
      id: product.id ?? product._id,
      slug: product.slug,
      name: product.name ?? product.title,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images?.[0],
      brandName: product.brandName || product.brand,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])

  const productId = product.id ?? product._id

  const currentVariant = (() => {
    const variants = product.variants ?? []
    const match = variants.find((v: any) => {
      let opts: Record<string, string> = {}
      try { opts = JSON.parse(v.optionsJson || "{}") } catch { /**/ }
      return (!selectedSize || opts.size === selectedSize) && (!selectedColor || opts.color === selectedColor)
    })
    return match ?? variants[0]
  })()
  const variantId = currentVariant?.id ?? product.defaultVariantId

  let tierPricing: Array<{ minQuantity: number; discountPercent: number }> = []
  try { if (currentVariant?.tierPricingJson) tierPricing = JSON.parse(currentVariant.tierPricingJson) } catch { /**/ }

  const activeDiscount = tierPricing
    .filter((t) => quantity >= t.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0]

  const bundles = product.productRelations?.filter((r: any) => r.relationType === "BUNDLE") ?? []
  const recommended = product.productRelations?.filter((r: any) =>
    r.relationType === "CROSS_SELL" || r.relationType === "UPSELL"
  ) ?? []

  const handleAddToCart = async () => {
    if (!variantId) { toast({ title: "No variant available", variant: "destructive" }); return }
    setLoading(true)
    try {
      await addToCart({ variantId, quantity })
      setJustAdded(true)
      toast({ title: "Added to Bag!", description: `${product.name ?? product.title} added to your cart.` })
    } catch (error) {
      toast({ title: "Failed to add", description: error instanceof Error ? error.message : "", variant: "destructive" })
    } finally { setLoading(false) }
  }

  const handleBuyNow = async () => {
    if (!variantId) { toast({ title: "No variant available", variant: "destructive" }); return }
    setLoading(true)
    try {
      await clearCart()
      await addToCart({ variantId, quantity })
      router.push("/checkout")
    } catch (error) {
      toast({ title: "Failed to process", description: error instanceof Error ? error.message : "", variant: "destructive" })
      setLoading(false)
    }
  }

  const handleNotifyMe = async () => {
    if (!variantId) return
    if (!session) { window.location.href = `/auth/login?redirect=/products/${product.slug}`; return }
    setNotifyLoading(true)
    try {
      await alertsApi.notifyMeWhenInStock(variantId)
      setNotifySubscribed(true)
      toast({ title: "We'll let you know" })
    } catch (error) {
      toast({ title: "Couldn't subscribe", description: error instanceof Error ? error.message : "", variant: "destructive" })
    } finally { setNotifyLoading(false) }
  }

  const handleShare = async () => {
    if (navigator.share && window.innerWidth < 768) {
      try { await navigator.share({ title: product.name, text: `Check out ${product.name}!`, url: window.location.href }) }
      catch { /**/ }
    } else { setIsShareOpen(true) }
  }

  const copyLink = () => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied!" }); setIsShareOpen(false) }

  const handleCompare = () => {
    const existingStr = localStorage.getItem("bf_compare") || "[]"
    let existing: any[] = []
    try { existing = JSON.parse(existingStr) } catch { /**/ }
    if (!existing.find((p) => p.id === productId)) {
      existing.push({ id: productId, name: product.name, image: product.images?.[0], price: product.price })
      localStorage.setItem("bf_compare", JSON.stringify(existing))
      toast({ title: "Added to compare", action: (<Button variant="outline" size="sm" onClick={() => router.push("/compare")}>Compare Now</Button>) })
    } else { toast({ title: "Already in comparison list" }) }
  }

  const handleWishlist = async () => {
    if (!session) { toast({ title: "Please login", variant: "destructive" }); return }
    setWishlistLoading(true)
    try { await toggleWishlist(productId) } catch { /**/ } finally { setWishlistLoading(false) }
  }

  const checkDelivery = async () => {
    if (!pincode || pincode.length !== 6) { toast({ title: "Enter a valid 6-digit pincode", variant: "destructive" }); return }
    try {
      const data = await checkoutApi.checkPincode(pincode)
      setDeliveryInfo(data.serviceable ? `✓ Delivery available to ${data.city}, ${data.state}` : "✗ Delivery not available at this location")
    } catch { setDeliveryInfo("✓ Free delivery on orders above ₹499") }
  }

  /* ── Derived values ─────────────────────────────────────────── */
  const discountPct = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  const media: MediaItem[] = [
    ...(product.images?.length > 0 ? product.images : ["/placeholder.svg"]).map((url: string) => ({ type: "image" as MediaType, url })),
    ...(product.videos || []).map((url: string) => ({ type: "video" as MediaType, url })),
    ...(product.view360Images?.length > 0 ? [{ type: "360" as MediaType, url: product.view360Images[0] }] : []),
  ]
  const activeMedia = media[selectedMedia] || media[0]

  const parsedVariantOptions: Array<Record<string, string>> = (product.variants ?? []).map((v: any) => {
    try { return JSON.parse(v.optionsJson || "{}") } catch { return {} }
  })
  const sizes: string[] = [...new Set(parsedVariantOptions.map((o) => o.size).filter(Boolean))]
  const colors: string[] = [...new Set(parsedVariantOptions.map((o) => o.color).filter(Boolean))]

  const brandName = product.brandName || (product.brand && !/^[0-9a-f-]{36}$/i.test(product.brand) ? product.brand : "") || ""

  let fashionAttrs: Record<string, unknown> = {}
  try { if (product.attributesJson) fashionAttrs = JSON.parse(product.attributesJson) } catch { /**/ }
  const fitGuide = fashionAttrs.fitGuide as { columns: string[]; rows: Record<string, string>[] } | undefined
  const careInstructions: string[] = Array.isArray(fashionAttrs.careInstructions) ? fashionAttrs.careInstructions as string[] : []
  const compatibility: string[] = Array.isArray(fashionAttrs.compatibility) ? fashionAttrs.compatibility as string[] : []
  const showRingSizeGuide = !!fashionAttrs.ringSizeGuide

  let specsObj: Record<string, string> = {}
  try { if (product.specificationsJson) specsObj = JSON.parse(product.specificationsJson) } catch { /**/ }
  const specsEntries = Object.entries(specsObj)

  const reviews = product.reviews || []
  const totalReviews = product.reviewCount ?? reviews.length
  const avgRating = product.rating ?? (reviews.length > 0
    ? reviews.reduce((s: number, r: any) => s + Number(r.rating), 0) / reviews.length : 0)

  /* Material badge from backend specs */
  const materialBadge = (() => {
    const fabric = specsObj["fabric"] || specsObj["material"] || specsObj["Fabric"] || specsObj["Material"]
    if (fabric) return fabric
    const h = (product.highlights || []).find((s: string) => /cotton|polyester|fabric|material/i.test(s))
    return h ? h.replace(/^.*?:\s*/, "") : null
  })()

  /* Best available coupon discount (from backend) */
  const bestCoupon = coupons
    .filter((c) => c.type === "percentage" && c.percentBps)
    .sort((a, b) => (b.percentBps ?? 0) - (a.percentBps ?? 0))[0]
  const lowestPrice = bestCoupon?.percentBps
    ? Math.round(product.price * (1 - bestCoupon.percentBps / 10000)) : null

  return (
    <div className="bg-[#FAF8F6] min-h-screen">
      <div className="container py-6 md:py-8">

        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
          <Link href="/" className="hover:text-brand-500">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-brand-500">Products</Link>
          {product.categoryName && (
            <>
              <span>/</span>
              <Link href={`/products?category=${encodeURIComponent(product.categoryName)}`} className="hover:text-brand-500">{product.categoryName}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-700 font-medium line-clamp-1">{product.name}</span>
        </nav>

        {/* Mobile title */}
        <div className="lg:hidden mb-4 bg-white rounded-xl p-4 shadow-sm">
          {brandName && <p className="text-[11px] font-bold uppercase tracking-widest text-brand-500 mb-1">{brandName}</p>}
          <h1 className="text-base font-semibold text-gray-900 leading-snug">{product.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={avgRating} size={12} />
            <span className="text-xs font-bold text-gray-700">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">| {totalReviews} ratings</span>
          </div>
        </div>

        {/* 2-col layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

          {/* LEFT: image gallery */}
          <div className="w-full lg:w-[52%] lg:sticky lg:top-24 flex flex-col lg:flex-row gap-3">
            <div className="hidden lg:flex flex-col gap-2 w-[72px] flex-shrink-0 max-h-[580px] overflow-y-auto scrollbar-hide">
              {media.map((item, idx) => (
                <button key={idx} onClick={() => setSelectedMedia(idx)}
                  className={`relative aspect-[3/4] w-full rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 bg-gray-100 ${selectedMedia === idx ? "border-brand-500" : "border-transparent hover:border-gray-300"}`}>
                  {item.type === "image" && <Image src={item.url} alt={`View ${idx + 1}`} fill className="object-cover" />}
                  {item.type === "video" && <span className="text-[9px] font-bold text-gray-500 absolute inset-0 flex items-center justify-center bg-gray-50">VIDEO</span>}
                  {item.type === "360" && <span className="text-[9px] font-bold text-gray-500 absolute inset-0 flex items-center justify-center bg-gray-50">360°</span>}
                </button>
              ))}
            </div>

            <div className="flex-1 relative aspect-[3/4] rounded-xl overflow-hidden bg-white shadow-sm">
              {activeMedia.type === "image" && <Image src={activeMedia.url} alt={product.name} fill className="object-cover" priority />}
              {activeMedia.type === "video" && <video src={activeMedia.url} controls autoPlay muted loop className="w-full h-full object-contain" />}
              {activeMedia.type === "360" && (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <Image src={activeMedia.url} alt="360" width={300} height={300} className="object-contain opacity-60" />
                  <span className="absolute text-xs text-gray-400 font-medium">360° View</span>
                </div>
              )}
              {discountPct > 0 && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">{discountPct}% OFF</div>
              )}
              {totalReviews > 0 && (
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">| {totalReviews}</span>
                </div>
              )}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button onClick={handleWishlist} className={`w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center transition-all hover:scale-110 ${isInWishlist(productId) ? "text-red-500" : "text-gray-500"}`}>
                  {wishlistLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={`w-4 h-4 ${isInWishlist(productId) ? "fill-current" : ""}`} />}
                </button>
                <button onClick={handleShare} className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-brand-500 transition-all hover:scale-110">
                  <Share2 className="w-4 h-4" />
                </button>
                <button onClick={handleCompare} className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-brand-500 transition-all hover:scale-110">
                  <GitCompare className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex lg:hidden gap-2 overflow-x-auto scrollbar-hide mt-1">
              {media.map((item, idx) => (
                <button key={idx} onClick={() => setSelectedMedia(idx)}
                  className={`relative w-14 h-[72px] flex-shrink-0 rounded-lg overflow-hidden border-2 bg-white ${selectedMedia === idx ? "border-brand-500" : "border-gray-200"}`}>
                  {item.type === "image" && <Image src={item.url} alt="" fill className="object-cover" />}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: product info */}
          <div className="w-full lg:w-[48%] space-y-0">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">

              {/* Brand + Title (desktop) */}
              <div className="hidden lg:block p-5 border-b border-gray-50">
                {brandName && <p className="text-[11px] font-bold uppercase tracking-widest text-brand-500 mb-1.5">{brandName}</p>}
                <h1 className="text-xl font-semibold text-gray-900 leading-snug mb-3">{product.name}</h1>
                {product.shortDescription && <p className="text-sm text-gray-500 mb-3">{product.shortDescription}</p>}
                <div className="flex items-center gap-2">
                  <StarRating rating={avgRating} size={14} />
                  <span className="text-sm font-bold text-gray-800">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">|</span>
                  <Link href="#reviews" className="text-sm text-gray-500 hover:text-brand-500">{totalReviews} ratings</Link>
                </div>
              </div>

              {/* Price */}
              <div className="p-5 border-b border-gray-50">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl font-bold text-gray-900">₹{product.price?.toLocaleString("en-IN")}</span>
                  {product.originalPrice > product.price && (
                    <>
                      <span className="text-base text-gray-400 line-through">₹{product.originalPrice?.toLocaleString("en-IN")}</span>
                      <span className="text-base font-bold text-green-600">{discountPct}% OFF</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>

                {/* Best price with real coupon from backend */}
                {lowestPrice !== null && lowestPrice < product.price && (
                  <div className="mt-3 bg-green-50 border border-green-100 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <p className="text-xs font-semibold text-green-700">
                      Get it for as low as <span className="font-bold">₹{lowestPrice.toLocaleString("en-IN")}</span>
                      {" "}using code <strong>{bestCoupon?.code}</strong>
                    </p>
                  </div>
                )}

                {/* Social proof — only from real review data */}
                {totalReviews >= 10 && (
                  <p className="text-xs font-semibold text-orange-600 mt-2">
                    🔥 {totalReviews}+ customers have reviewed this product
                  </p>
                )}

                {/* Material badge from specs/highlights in backend */}
                {materialBadge && (
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1">
                    <Package className="w-3 h-3 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700">{materialBadge}</span>
                  </div>
                )}
              </div>

              {/* Color selection — from variant optionsJson */}
              {colors.length > 0 && (
                <div className="p-5 border-b border-gray-50">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Colour: <span className="font-bold text-gray-900">{selectedColor || colors[0]}</span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color) => {
                      const hex = colorHex(color)
                      const light = isLightColor(hex)
                      const isSelected = selectedColor === color || (!selectedColor && color === colors[0])
                      return (
                        <button key={color} title={color} onClick={() => setSelectedColor(color)}
                          className="group relative flex flex-col items-center gap-1.5">
                          <span className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-gray-900 ring-2 ring-gray-900 ring-offset-1" : "border-gray-200 hover:border-gray-400"} ${light ? "shadow-inner" : ""}`}
                            style={{ backgroundColor: hex }}>
                            {isSelected && <Check className={`w-4 h-4 ${light ? "text-gray-900" : "text-white"}`} />}
                          </span>
                          <span className="text-[10px] text-gray-500 capitalize leading-tight max-w-[44px] text-center">{color}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Size selection — from variant optionsJson */}
              {sizes.length > 0 && (
                <div className="p-5 border-b border-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Select Size</p>
                    <div className="flex items-center gap-3">
                      {showRingSizeGuide && <RingSizeGuide />}
                      <Link href="/size-guide" className="text-xs font-semibold text-brand-500 flex items-center gap-1 hover:underline">
                        <Ruler className="w-3.5 h-3.5" /> Size Guide
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button key={size} onClick={() => setSelectedSize(size)}
                        className={`min-w-[48px] h-11 px-3 rounded-lg text-sm font-semibold border-2 transition-all ${selectedSize === size ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:border-gray-400 bg-white"}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                  {!selectedSize && sizes.length > 0 && (
                    <p className="text-xs text-red-500 mt-2">Please select a size to continue</p>
                  )}
                </div>
              )}

              {/* Tier pricing — from variant tierPricingJson */}
              {tierPricing.length > 0 && (
                <div className="p-5 border-b border-gray-50">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Buy More, Save More
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tierPricing.map((tier, idx) => (
                        <button key={idx} onClick={() => setQuantity(Math.max(quantity, tier.minQuantity))}
                          className={`border rounded-full px-3 py-1 text-xs font-semibold transition-all ${activeDiscount?.minQuantity === tier.minQuantity ? "border-amber-500 bg-amber-500 text-white" : "border-amber-300 text-amber-700 hover:bg-amber-100"}`}>
                          Buy {tier.minQuantity}+ → Extra {tier.discountPercent}% OFF
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Best coupon banner — only if real coupon from backend */}
              {bestCoupon && (
                <div className="px-5 py-4 border-b border-gray-50 bg-brand-50">
                  <p className="text-xs font-bold text-brand-700 mb-2">{couponLabel(bestCoupon)} with coupon</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-600">USE</span>
                    <CouponCode code={bestCoupon.code} />
                    {bestCoupon.minOrderMinor && (
                      <span className="text-xs text-gray-400">on orders above ₹{Number(bestCoupon.minOrderMinor) / 100}</span>
                    )}
                  </div>
                </div>
              )}

              {/* CTA buttons */}
              <div className="p-5 space-y-3">
                {(product.stock ?? 100) <= 0 ? (
                  <Button className="w-full h-12 bg-gray-900 hover:bg-black text-white font-bold text-sm uppercase tracking-wider rounded-xl"
                    onClick={handleNotifyMe} disabled={notifyLoading || notifySubscribed}>
                    {notifyLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {notifySubscribed ? "✓ We'll Notify You" : "Notify Me When In Stock"}
                  </Button>
                ) : (
                  <Button
                    className="w-full h-12 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2"
                    onClick={handleAddToCart} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                    {loading ? "Adding..." : justAdded ? "Added to Bag ✓" : "Add to Bag"}
                  </Button>
                )}
                <Button
                  className="w-full h-12 bg-gray-900 hover:bg-black text-white font-bold text-sm uppercase tracking-wider rounded-xl"
                  onClick={handleBuyNow} disabled={loading || (product.stock ?? 100) <= 0}>
                  Buy Now
                </Button>
                {justAdded && (
                  <Link href="/cart"
                    className="w-full h-10 border border-brand-400 rounded-xl text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors flex items-center justify-center gap-2">
                    Go to Bag <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {/* Real coupons from backend publicCoupons query */}
              {coupons.length > 0 && (
                <div className="px-5 pb-5 space-y-2.5">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Available Offers</p>
                  <div className="space-y-2">
                    {coupons.slice(0, 4).map((c) => (
                      <div key={c.id} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
                        <Tag className="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-700">{couponDescription(c)}</p>
                          <div className="mt-1"><CouponCode code={c.code} /></div>
                        </div>
                      </div>
                    ))}
                    {tierPricing.length > 0 && (
                      <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
                        <Tag className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-700">
                            Buy {tierPricing[0].minQuantity}+ and get extra {tierPricing[0].discountPercent}% OFF
                          </p>
                          <span className="text-[10px] text-green-600 font-semibold">Auto applied in cart</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Delivery check — real pincode API */}
            <div className="bg-white rounded-xl shadow-sm p-5 mt-4 space-y-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-500" /> Check Delivery
              </h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Enter Pincode" value={pincode}
                  onChange={(e) => { setPincode(e.target.value.replace(/\D/g, "").slice(0, 6)); setDeliveryInfo(null) }}
                  onKeyDown={(e) => e.key === "Enter" && checkDelivery()}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 bg-[#FAF8F6]" />
                <button onClick={checkDelivery}
                  className="px-4 text-sm font-bold text-brand-500 hover:text-brand-600 border border-brand-300 rounded-lg hover:bg-brand-50 transition-colors">
                  Check
                </button>
              </div>
              {deliveryInfo ? (
                <p className={`text-sm font-medium ${deliveryInfo.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{deliveryInfo}</p>
              ) : (
                <p className="text-xs text-green-600 flex items-center gap-1.5 font-semibold">
                  <Truck className="w-3.5 h-3.5" /> Free shipping on orders above ₹499
                </p>
              )}
            </div>

            {/* Trust badges */}
            <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { Icon: Truck, label: "Free Delivery", sub: "on ₹499+" },
                  { Icon: RotateCcw, label: "7-Day Returns", sub: "easy exchange" },
                  { Icon: Shield, label: "100% Genuine", sub: "quality assured" },
                ].map(({ Icon, label, sub }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-brand-500" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-800">{label}</p>
                    <p className="text-[10px] text-gray-400">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key highlights — from real specificationsJson / highlights */}
            {(specsEntries.length > 0 || (product.highlights?.length ?? 0) > 0) && (
              <div className="bg-white rounded-xl shadow-sm p-5 mt-4">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">Key Highlights</h3>
                {specsEntries.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {specsEntries.slice(0, 8).map(([key, val]) => (
                      <div key={key}>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">{key.replace(/_/g, " ")}</p>
                        <p className="text-xs font-semibold text-gray-900">{val}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {(product.highlights || []).slice(0, 6).map((h: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Tags — from backend product tags */}
            {(product.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {product.tags.map((tag: string) => (
                  <span key={tag} className="text-[11px] bg-white border border-gray-200 text-gray-500 px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            )}

            {/* Device compatibility — from backend attributesJson.compatibility */}
            {compatibility.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5 mt-4">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Compatible Devices</h3>
                <DeviceCompatibility devices={compatibility} />
              </div>
            )}
          </div>
        </div>

        {/* Full-width sections */}
        <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Description from backend descriptionHtml */}
          <Accordion title="Product Description" defaultOpen>
            {product.descriptionHtml ? (
              <div className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none px-5"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
            ) : (
              <p className="text-sm text-gray-400 px-5">No description available.</p>
            )}
          </Accordion>

          {/* Specifications from backend specificationsJson */}
          {specsEntries.length > 0 && (
            <Accordion title="Product Specifications">
              <div className="overflow-hidden rounded-lg border border-gray-100 mx-5">
                <table className="w-full text-sm">
                  <tbody>
                    {specsEntries.map(([key, val], i) => (
                      <tr key={key} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="px-4 py-2.5 font-medium text-gray-600 w-2/5 capitalize">{key.replace(/_/g, " ")}</td>
                        <td className="px-4 py-2.5 text-gray-800 font-semibold">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Accordion>
          )}

          {/* Size & Fit from backend attributesJson */}
          {(fitGuide || careInstructions.length > 0) && (
            <Accordion title="Size & Fit">
              <div className="space-y-5 px-5">
                {fitGuide && <FitGuide fitGuide={fitGuide} />}
                {careInstructions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-gray-700 mb-2">Care Instructions</h4>
                    <ul className="space-y-1.5">
                      {careInstructions.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Accordion>
          )}
        </div>

        {/* Reviews — real review data from backend */}
        <div id="reviews" className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Customer Reviews
            {totalReviews > 0 && <span className="text-gray-400 font-normal text-sm ml-2">({totalReviews})</span>}
          </h2>
          {reviews.length > 0 && (
            <div className="mb-8 pb-8 border-b border-gray-100">
              <RatingBreakdown reviews={reviews} totalCount={totalReviews} avg={avgRating} />
            </div>
          )}
          <ReviewSummary productId={productId} />
          <ReviewSection productId={product._id} reviews={reviews} />
        </div>

        {/* Q&A — real data from backend */}
        {questions.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Questions & Answers</h2>
            <QnaSection productId={product._id} questions={questions} />
          </div>
        )}

        {/* Frequently Bought Together — from backend BUNDLE productRelations */}
        {bundles.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Frequently Bought Together</h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
              {bundles.map((bundle: any) => {
                const p = bundle.targetProduct
                if (!p) return null
                const bundlePrice = bundle.bundlePriceMinor
                  ? Number(bundle.bundlePriceMinor) / 100
                  : p.variants?.[0]?.priceMinor ? Number(p.variants[0].priceMinor) / 100 : 0
                return (
                  <div key={bundle.id} className="flex-shrink-0 w-44 border border-gray-100 rounded-xl p-3 hover:shadow-md transition-shadow">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-50 mb-2">
                      {p.images?.[0] && <Image src={p.images[0]} alt={p.title} fill className="object-cover" />}
                    </div>
                    <p className="text-xs font-semibold text-gray-900 line-clamp-2 mb-1">{p.title}</p>
                    <p className="text-sm font-bold text-gray-900">₹{bundlePrice.toLocaleString("en-IN")}</p>
                    <button
                      onClick={async () => {
                        if (!p.variants?.[0]?.id) return
                        await addToCart({ variantId: p.variants[0].id, quantity: 1 })
                        toast({ title: "Added to bag!" })
                      }}
                      className="mt-2 w-full text-[11px] font-bold bg-gray-900 text-white rounded-lg py-2 hover:bg-brand-500 transition-colors">
                      Add to Bag
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* You May Also Like — from CROSS_SELL/UPSELL relations or related products */}
        {(recommended.length > 0 || relatedProducts.length > 0) && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">You May Also Like</h2>
            <Carousel opts={{ align: "start", dragFree: true }}>
              <CarouselContent className="-ml-4">
                {(recommended.length > 0
                  ? recommended.map((r: any) => {
                      const p = r.targetProduct
                      if (!p) return null
                      return {
                        _id: p.id, id: p.id, slug: p.slug, title: p.title, name: p.title,
                        images: p.images,
                        price: p.variants?.[0]?.priceMinor ? Number(p.variants[0].priceMinor) / 100 : 0,
                        originalPrice: p.variants?.[0]?.compareAtMinor ? Number(p.variants[0].compareAtMinor) / 100 : 0,
                      }
                    }).filter(Boolean)
                  : relatedProducts
                ).map((p: any, i: number) => (
                  <CarouselItem key={p._id ?? i} className="pl-4 basis-[48%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                    <ProductCard product={p} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4 bg-white border border-gray-200 hover:border-brand-500 shadow-sm" />
              <CarouselNext className="hidden md:flex -right-4 bg-white border border-gray-200 hover:border-brand-500 shadow-sm" />
            </Carousel>
          </div>
        )}

        <AiProductRecs productId={productId} />

        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <RecentlyViewedStrip excludeId={productId} />
        </div>
      </div>

      {/* Share dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Share this product</DialogTitle></DialogHeader>
          <div className="flex items-center justify-center gap-4 py-6">
            {[
              { href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${product.name} — ${typeof window !== "undefined" ? window.location.href : ""}`)}`, Icon: MessageCircle, label: "WhatsApp", bg: "bg-green-50", color: "text-green-600" },
              { href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`, Icon: Facebook, label: "Facebook", bg: "bg-blue-50", color: "text-blue-600" },
              { href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(product.name)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`, Icon: Twitter, label: "Twitter", bg: "bg-sky-50", color: "text-sky-500" },
            ].map(({ href, Icon, label, bg, color }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={`flex flex-col items-center gap-2 ${color}`}>
                <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-gray-600">{label}</span>
              </a>
            ))}
            <button onClick={copyLink} className="flex flex-col items-center gap-2 text-gray-600">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Copy className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium">Copy Link</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ── AI Recommendations ───────────────────────────────────────── */
function AiProductRecs({ productId }: { productId: string }) {
  const [recs, setRecs] = useState<any[]>([])
  useEffect(() => {
    aiProductRecommendations(productId).then(setRecs).catch(() => undefined)
  }, [productId])
  if (recs.length === 0) return null
  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
        <span className="text-brand-500">✨</span> AI Picks For You
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {recs.map((p: any) => {
          const mapped = {
            _id: p.id, id: p.id, slug: p.slug, title: p.title, name: p.title,
            images: p.images,
            price: p.variants?.[0]?.priceMinor ? Number(p.variants[0].priceMinor) / 100 : 0,
            originalPrice: p.variants?.[0]?.compareAtMinor ? Number(p.variants[0].compareAtMinor) / 100 : 0,
          }
          return <ProductCard key={p.id} product={mapped} />
        })}
      </div>
    </div>
  )
}
