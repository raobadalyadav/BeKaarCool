"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, ShoppingBag, Heart, Truck, Shield, RotateCcw, MapPin, Ruler, Loader2, Share2, GitCompare, Facebook, Twitter, MessageCircle, Copy, Tag, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ReviewSection } from "@/components/product/review-section"
import { ProductCard } from "@/components/product/product-card"
import { useSession } from "next-auth/react"
import { ReviewSummary } from "@/components/ai/review-summary"
import { FitGuide } from "@/components/product/fit-guide"
import { RingSizeGuide } from "@/components/product/ring-size-guide"
import { DeviceCompatibility } from "@/components/product/device-compatibility"

interface QnaAnswer {
    id: string
    answer: string
    isOfficial: boolean
    upvotes: number
    createdAt: string
}

interface QnaQuestion {
    id: string
    question: string
    upvotes: number
    createdAt: string
    answers: QnaAnswer[]
}

interface ProductDetailClientProps {
    product: any
    relatedProducts?: any[]
    questions?: QnaQuestion[]
}

type MediaType = "image" | "video" | "360"
interface MediaItem {
    type: MediaType
    url: string
}

import { useCart } from "@/contexts/cart-context"
import { useWishlist } from "@/hooks/use-wishlist"
import * as checkoutApi from "@/lib/api/checkout"
import * as alertsApi from "@/lib/api/alerts"
import { QnaSection } from "@/components/product/qna-section"
import { RecentlyViewedStrip } from "@/components/product/recently-viewed-strip"
import { useRecentlyViewed } from "@/hooks/use-recently-viewed"
import { aiProductRecommendations } from "@/lib/api/ai"

export default function ProductDetailClient({ product, relatedProducts = [], questions = [] }: ProductDetailClientProps) {
    const router = useRouter()
    const [selectedMedia, setSelectedMedia] = useState(0)
    const [selectedSize, setSelectedSize] = useState("")
    const [selectedColor, setSelectedColor] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [isWishlisted, setIsWishlisted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [wishlistLoading, setWishlistLoading] = useState(false)
    const [pincode, setPincode] = useState("")
    const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [notifyLoading, setNotifyLoading] = useState(false)
    const [notifySubscribed, setNotifySubscribed] = useState(false)

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

    const productId = product.id ?? product._id;
    const currentVariant = (() => {
        const variants = product.variants ?? []
        // Try to find exact match by parsed options
        const match = variants.find((v: any) => {
            let opts: Record<string, string> = {}
            try { opts = JSON.parse(v.optionsJson || "{}") } catch { /* */ }
            const sizeOk = !selectedSize || opts.size === selectedSize
            const colorOk = !selectedColor || opts.color === selectedColor
            return sizeOk && colorOk
        })
        return match ?? variants[0]
    })()
    const variantId = currentVariant?.id ?? product.defaultVariantId
    
    let tierPricing: Array<{minQuantity: number, discountPercent: number}> = []
    try {
        if (currentVariant?.tierPricingJson) {
            tierPricing = JSON.parse(currentVariant.tierPricingJson)
        }
    } catch { }

    const activeDiscount = tierPricing
        .filter(t => quantity >= t.minQuantity)
        .sort((a, b) => b.minQuantity - a.minQuantity)[0];

    const bundles = product.productRelations?.filter((r: any) => r.relationType === "BUNDLE") ?? [];
    const recommended = product.productRelations?.filter((r: any) => r.relationType === "CROSS_SELL" || r.relationType === "UPSELL") ?? [];

    const handleAddToCart = async () => {
        if (!variantId) {
            toast({ title: "No variant available", variant: "destructive" })
            return
        }
        setLoading(true)
        try {
            await addToCart({ variantId, quantity })
            toast({
                title: "Added to Bag!",
                description: `${product.name ?? product.title} has been added to your cart.`,
            })
        } catch (error) {
            toast({
                title: "Failed to add",
                description: error instanceof Error ? error.message : "",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleBuyNow = async () => {
        if (!variantId) {
            toast({ title: "No variant available", variant: "destructive" })
            return
        }
        setLoading(true)
        try {
            await clearCart()
            await addToCart({ variantId, quantity })
            router.push('/checkout')
        } catch (error) {
            toast({
                title: "Failed to process",
                description: error instanceof Error ? error.message : "",
                variant: "destructive",
            })
            setLoading(false)
        }
    }

    const handleNotifyMe = async () => {
        if (!variantId) return
        if (!session) {
            window.location.href = `/auth/login?redirect=/products/${product.slug}`
            return
        }
        setNotifyLoading(true)
        try {
            await alertsApi.notifyMeWhenInStock(variantId)
            setNotifySubscribed(true)
            toast({
                title: "We'll let you know",
                description: "You'll get an email the moment this is back in stock.",
            })
        } catch (error) {
            toast({
                title: "Couldn't subscribe",
                description: error instanceof Error ? error.message : "",
                variant: "destructive",
            })
        } finally {
            setNotifyLoading(false)
        }
    }

    const handleShare = async () => {
        if (navigator.share && window.innerWidth < 768) {
            try {
                await navigator.share({
                    title: product.name,
                    text: `Check out ${product.name} on Baefikra!`,
                    url: window.location.href,
                })
            } catch (err) {
                console.log("Error sharing", err)
            }
        } else {
            setIsShareOpen(true)
        }
    }

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        toast({ title: "Link copied to clipboard!" })
        setIsShareOpen(false)
    }

    const handleCompare = () => {
        const existingStr = localStorage.getItem("bf_compare") || "[]"
        let existing: any[] = []
        try { existing = JSON.parse(existingStr) } catch { }
        if (!existing.find(p => p.id === productId)) {
            existing.push({ id: productId, name: product.name, image: product.images?.[0], price: product.price })
            localStorage.setItem("bf_compare", JSON.stringify(existing))
            toast({
                title: "Added to compare",
                description: "You can view comparison from the compare page.",
                action: (
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/compare'}>
                        Compare Now
                    </Button>
                )
            })
        } else {
            toast({ title: "Already in comparison list" })
        }
    }

    const handleWishlist = async () => {
        if (!session) {
            toast({
                title: "Please login",
                description: "You need to be logged in to add items to wishlist",
                variant: "destructive"
            })
            return
        }

        setWishlistLoading(true)
        try {
            await toggleWishlist(productId)
            setIsWishlisted(isInWishlist(productId))
        } catch (error) {
            console.error("Wishlist error:", error)
        } finally {
            setWishlistLoading(false)
        }
    }

    const checkDelivery = async () => {
        if (!pincode || pincode.length !== 6) {
            toast({
                title: "Invalid Pincode",
                description: "Please enter a valid 6-digit pincode",
                variant: "destructive"
            })
            return
        }

        try {
            const data = await checkoutApi.checkPincode(pincode)
            if (data.serviceable) {
                setDeliveryInfo(`Delivery available to ${data.city}, ${data.state}`)
            } else {
                setDeliveryInfo("Sorry, delivery not available at this location")
            }
        } catch (error) {
            setDeliveryInfo("Free delivery on orders above ₹499")
        }
    }

    const discountPercentage = product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0

    const media: MediaItem[] = [
        ...(product.images && product.images.length > 0 ? product.images : ["/placeholder.svg"]).map((url: string) => ({ type: "image" as MediaType, url })),
        ...(product.videos || []).map((url: string) => ({ type: "video" as MediaType, url })),
        ...(product.view360Images || []).length > 0 ? [{ type: "360" as MediaType, url: product.view360Images[0] }] : [] // For now, just represent 360 as a single item
    ]
    const activeMedia = media[selectedMedia] || media[0]

    // Parse variant options from optionsJson (JSON string like {"size":"M","color":"Blue"})
    const parsedVariantOptions: Array<Record<string, string>> = (product.variants ?? []).map((v: any) => {
        try { return JSON.parse(v.optionsJson || "{}") } catch { return {} }
    })
    const sizes: string[] = [...new Set(parsedVariantOptions.map((o) => o.size).filter(Boolean))]
    const colors: string[] = [...new Set(parsedVariantOptions.map((o) => o.color).filter(Boolean))]

    const categoryName = product.categoryName || (typeof product.category === 'object' ? product.category.name : "")

    const brandName = product.brandName || (product.brand && !/^[0-9a-f-]{36}$/i.test(product.brand) ? product.brand : "") || "Baefikra"

    // Fashion & jewellery attributes parsed from attributesJson
    let fashionAttrs: Record<string, unknown> = {}
    try {
        if (product.attributesJson) fashionAttrs = JSON.parse(product.attributesJson)
    } catch { /* */ }
    const fitGuide = fashionAttrs.fitGuide as { columns: string[]; rows: Record<string, string>[] } | undefined
    const careInstructions: string[] = Array.isArray(fashionAttrs.careInstructions) ? fashionAttrs.careInstructions as string[] : []
    const compatibility: string[] = Array.isArray(fashionAttrs.compatibility) ? fashionAttrs.compatibility as string[] : []
    const showRingSizeGuide = !!fashionAttrs.ringSizeGuide
    const hasSizeFitTab = !!(fitGuide || careInstructions.length > 0)

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Mobile-only: title shown above the image */}
            <div className="lg:hidden mb-3">
                <p className="text-sm font-semibold text-gray-500 mb-0.5">{brandName}</p>
                <h1 className="text-lg font-normal text-gray-800 leading-snug">{product.name}</h1>
            </div>

            {/* flex-col on mobile so image comes after title, flex-row on desktop */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
                {/* Left Column: Image Gallery */}
                <div className="w-full lg:w-[58%] flex flex-col lg:flex-row gap-4 h-fit lg:sticky lg:top-24">
                    {/* Thumbnails (Vertical on Desktop) */}
                    <div className="hidden lg:flex flex-col gap-4 w-20 flex-shrink-0 h-[600px] overflow-y-auto scrollbar-hide">
                        {media.map((item, idx) => (
                            <div
                                key={idx}
                                className={`aspect-[3/4] relative cursor-pointer border-2 rounded transition-all flex items-center justify-center bg-gray-100 ${selectedMedia === idx ? 'border-[#F38508]' : 'border-transparent hover:border-gray-300'}`}
                                onMouseEnter={() => setSelectedMedia(idx)}
                            >
                                {item.type === "image" && <Image src={item.url} alt={`Thumb ${idx}`} fill className="object-cover rounded-sm" />}
                                {item.type === "video" && <span className="text-xs font-bold text-gray-500">VIDEO</span>}
                                {item.type === "360" && <span className="text-xs font-bold text-gray-500">360°</span>}
                            </div>
                        ))}
                    </div>

                    {/* Main Image */}
                    <div className="flex-1 relative aspect-[3/4] lg:h-[600px] bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                        {activeMedia.type === "image" && (
                            <Image
                                src={activeMedia.url}
                                alt={product.name}
                                fill
                                className="object-contain lg:object-cover transition-opacity duration-300"
                                priority
                            />
                        )}
                        {activeMedia.type === "video" && (
                            <video src={activeMedia.url} controls autoPlay muted loop className="w-full h-full object-contain" />
                        )}
                        {activeMedia.type === "360" && (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                                <span className="text-gray-500 text-lg font-bold mb-4">360° View Interaction</span>
                                {/* Normally we'd use a 360 viewer component here like react-360-view */}
                                <Image src={activeMedia.url} alt="360 base" width={300} height={300} className="object-contain opacity-50" />
                                <p className="text-xs text-gray-400 mt-2">Interactive 360 view enabled</p>
                            </div>
                        )}

                        {discountPercentage > 0 && (
                            <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                                {discountPercentage}% OFF
                            </div>
                        )}

                        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1 text-sm font-semibold shadow-sm">
                            {product.rating?.toFixed(1) || "4.0"} <Star className="w-3 h-3 fill-[#F38508] text-[#F38508]" /> | {product.reviewCount || 0}
                        </div>
                    </div>

                    {/* Mobile Thumbnails (Horizontal) */}
                    <div className="flex lg:hidden gap-2 overflow-x-auto scrollbar-hide">
                        {media.map((item, idx) => (
                            <div
                                key={idx}
                                className={`relative w-16 h-20 flex-shrink-0 border-2 rounded flex items-center justify-center bg-gray-100 ${selectedMedia === idx ? 'border-[#F38508]' : 'border-gray-200'}`}
                                onClick={() => setSelectedMedia(idx)}
                            >
                                {item.type === "image" && <Image src={item.url} alt={`Thumb ${idx}`} fill className="object-cover rounded-sm" />}
                                {item.type === "video" && <span className="text-[10px] font-bold text-gray-500">VID</span>}
                                {item.type === "360" && <span className="text-[10px] font-bold text-gray-500">360°</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Product Details */}
                <div className="w-full lg:w-[42%] space-y-5">
                    <div>
                        {/* Desktop-only title (on mobile it's shown above the image) */}
                        <div className="hidden lg:block">
                            <h3 className="text-lg font-semibold text-gray-500 mb-1">{brandName}</h3>
                            <h1 className="text-xl md:text-2xl font-normal text-gray-800 leading-snug mb-2">{product.name}</h1>
                            {product.shortDescription && (
                                <p className="text-sm text-gray-500 leading-relaxed">{product.shortDescription}</p>
                            )}
                        </div>
                        {/* Mobile: short description only (title already shown above) */}
                        {product.shortDescription && (
                            <p className="lg:hidden text-sm text-gray-500 leading-relaxed mb-2">{product.shortDescription}</p>
                        )}

                        {/* Price Section */}
                        <div className="flex items-baseline gap-3 mt-4">
                            <span className="text-2xl md:text-3xl font-bold text-gray-900">₹{product.price}</span>
                            {product.originalPrice > product.price && (
                                <>
                                    <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                                    <span className="text-sm font-bold text-green-600">{discountPercentage}% OFF</span>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">inclusive of all taxes</p>
                        
                        {/* Tier Pricing */}
                        {tierPricing.length > 0 && (
                            <div className="mt-4 bg-orange-50 border border-orange-100 p-3 rounded-md">
                                <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <Tag className="w-3 h-3" /> Buy More, Save More
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {tierPricing.map((tier, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`border rounded px-2 py-1.5 text-center text-xs transition-colors cursor-pointer ${
                                                activeDiscount?.minQuantity === tier.minQuantity 
                                                ? 'border-[#F38508] bg-white ring-1 ring-[#F38508]' 
                                                : 'border-orange-200 bg-white/60 hover:bg-white'
                                            }`}
                                            onClick={() => setQuantity(Math.max(quantity, tier.minQuantity))}
                                        >
                                            <div className="font-semibold text-gray-900">Buy {tier.minQuantity}+</div>
                                            <div className="text-[#F38508] font-bold">Extra {tier.discountPercent}% OFF</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 p-3 rounded border border-dashed border-gray-300">
                        <p className="text-xs font-semibold flex items-center gap-2">
                            <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-bold rounded">TRIBE</span>
                            TriBe members get an extra discount of ₹40
                        </p>
                    </div>

                    <Separator className="bg-gray-100" />

                    {/* Color Selection */}
                    {colors.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-sm uppercase tracking-wide mb-3">Select Color</h3>
                            <div className="flex flex-wrap gap-3">
                                {colors.map((color: string) => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`px-3 h-8 rounded border-2 text-sm transition-all ${selectedColor === color
                                            ? 'border-black bg-black text-white'
                                            : 'border-gray-300 text-gray-600 hover:border-black'
                                            }`}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                            {selectedColor && <p className="text-sm text-gray-600 mt-2">{selectedColor}</p>}
                        </div>
                    )}

                    {/* Sizes */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-sm uppercase tracking-wide">Select Size</h3>
                            <div className="flex items-center gap-3">
                                {showRingSizeGuide && <RingSizeGuide />}
                                <Link href="/size-guide" className="text-teal-600 text-sm font-semibold flex items-center gap-1 hover:underline">
                                    <Ruler className="w-4 h-4" /> Size Guide
                                </Link>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {sizes.map((size: string) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`w-12 h-12 rounded-md flex items-center justify-center border font-medium transition-all ${selectedSize === size
                                        ? 'border-black bg-white text-black ring-1 ring-black shadow-sm'
                                        : 'border-gray-300 text-gray-600 hover:border-black'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                        {!selectedSize && (
                            <p className="text-xs text-red-500 mt-2">Please select a size</p>
                        )}
                    </div>

                    {/* Quantity */}
                    {(product.stock ?? 100) > 0 && (
                        <div className="flex items-center gap-4 mt-6">
                            <h3 className="font-semibold text-sm uppercase tracking-wide">Quantity</h3>
                            <div className="flex items-center border border-gray-300 rounded-md h-10">
                                <button 
                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 h-full flex items-center justify-center transition-colors rounded-l-md"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <span className="px-4 py-1 font-medium text-sm min-w-[2.5rem] text-center">{quantity}</span>
                                <button 
                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 h-full flex items-center justify-center transition-colors rounded-r-md"
                                    onClick={() => setQuantity(q => Math.min(product.stock ?? 10, q + 1))}
                                    disabled={quantity >= (product.stock ?? 10)}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-2 pt-4">
                        {/* Row 1: Primary CTAs */}
                        <div className="flex gap-2">
                            {(product.stock ?? 100) <= 0 ? (
                                <Button
                                    className="flex-1 bg-gray-900 hover:bg-black text-white font-bold h-12 text-sm uppercase tracking-wider"
                                    onClick={handleNotifyMe}
                                    disabled={notifyLoading || notifySubscribed}
                                >
                                    {notifyLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    {notifySubscribed ? "We'll notify you" : "Notify me when in stock"}
                                </Button>
                            ) : (
                                <Button
                                    className="flex-1 bg-[#F38508] hover:bg-[#D97706] text-black font-bold h-12 text-sm uppercase tracking-wider"
                                    onClick={handleAddToCart}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingBag className="w-4 h-4 mr-2" />}
                                    {loading ? "Adding..." : "Add to Bag"}
                                </Button>
                            )}
                            <Button
                                className="flex-1 bg-black hover:bg-gray-800 text-white font-bold h-12 text-sm uppercase tracking-wider"
                                onClick={handleBuyNow}
                                disabled={loading || (product.stock ?? 100) <= 0}
                            >
                                Buy Now
                            </Button>
                            {/* Desktop: icon buttons inline with CTAs */}
                            <Button
                                variant="outline"
                                className={`hidden lg:flex h-12 px-4 border-gray-300 ${isWishlisted ? 'text-[#F38508] border-[#F38508]/30 bg-orange-50' : 'text-gray-600'}`}
                                onClick={handleWishlist}
                                disabled={wishlistLoading}
                            >
                                {wishlistLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />}
                            </Button>
                            <Button variant="outline" className="hidden lg:flex h-12 w-12 px-0 border-gray-300 text-gray-600 hover:text-black hover:border-black" onClick={handleShare}>
                                <Share2 className="w-5 h-5" />
                            </Button>
                            <Button variant="outline" className="hidden lg:flex h-12 w-12 px-0 border-gray-300 text-gray-600 hover:text-black hover:border-black" onClick={handleCompare}>
                                <GitCompare className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Row 2: Mobile-only secondary actions */}
                        <div className="flex lg:hidden gap-2">
                            <Button
                                variant="outline"
                                className={`flex-1 h-11 border-gray-300 flex items-center justify-center gap-2 text-sm font-medium ${isWishlisted ? 'text-[#F38508] border-[#F38508]/40 bg-orange-50' : 'text-gray-700'}`}
                                onClick={handleWishlist}
                                disabled={wishlistLoading}
                            >
                                {wishlistLoading
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />}
                                Wishlist
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 h-11 border-gray-300 text-gray-700 flex items-center justify-center gap-2 text-sm font-medium hover:border-black"
                                onClick={handleShare}
                            >
                                <Share2 className="w-4 h-4" /> Share
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 h-11 border-gray-300 text-gray-700 flex items-center justify-center gap-2 text-sm font-medium hover:border-black"
                                onClick={handleCompare}
                            >
                                <GitCompare className="w-4 h-4" /> Compare
                            </Button>
                        </div>
                    </div>

                    <Separator className="bg-gray-100" />

                    {/* Frequently Bought Together (Bundles) */}
                    {bundles.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm uppercase flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" /> Frequently Bought Together
                            </h3>
                            <div className="space-y-3">
                                {bundles.map((bundle: any) => (
                                    <div key={bundle.id} className="border rounded-md p-3 flex flex-col sm:flex-row items-center gap-4 bg-gray-50">
                                        <div className="flex items-center gap-2 flex-1">
                                            <div className="relative w-12 h-16 bg-white border rounded">
                                                {product.images?.[0] && <Image src={product.images[0]} alt="Current" fill className="object-cover" />}
                                            </div>
                                            <Plus className="w-4 h-4 text-gray-400" />
                                            <div className="relative w-12 h-16 bg-white border rounded">
                                                {bundle.targetProduct?.images?.[0] && <Image src={bundle.targetProduct.images[0]} alt="Bundle" fill className="object-cover" />}
                                            </div>
                                            <div className="ml-2 flex-1">
                                                <p className="text-xs font-semibold text-gray-900 line-clamp-1">{bundle.targetProduct?.title}</p>
                                                <p className="text-xs text-[#F38508] font-bold">
                                                    Bundle Price: ₹{bundle.bundlePriceMinor ? Number(bundle.bundlePriceMinor) / 100 : bundle.targetProduct?.priceMinor}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 text-xs h-8"
                                            onClick={async () => {
                                                setLoading(true);
                                                try {
                                                    if (variantId) await addToCart({ variantId, quantity: 1 });
                                                    if (bundle.targetProduct?.variants?.[0]?.id) {
                                                        await addToCart({ variantId: bundle.targetProduct.variants[0].id, quantity: 1 });
                                                    }
                                                    toast({ title: "Bundle Added", description: "Both items added to cart." });
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            disabled={loading}
                                        >
                                            Add Both
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Separator className="bg-gray-100" />

                    {/* Delivery Checker */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm uppercase flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Check for Delivery Details
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter Pincode"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                            />
                            <button
                                onClick={checkDelivery}
                                className="text-teal-600 font-bold text-sm px-4 hover:underline"
                            >
                                Check
                            </button>
                        </div>
                        {deliveryInfo && (
                            <p className="text-sm text-green-600">{deliveryInfo}</p>
                        )}
                    </div>

                    {/* Trust Badges */}
                    <div className="flex justify-between items-start pt-4">
                        <div className="text-center w-1/3 px-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                                <Truck className="w-4 h-4 text-gray-600" />
                            </div>
                            <p className="text-[10px] text-gray-500">Free delivery for Tribe Members</p>
                        </div>
                        <div className="text-center w-1/3 px-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                                <Shield className="w-4 h-4 text-gray-600" />
                            </div>
                            <p className="text-[10px] text-gray-500">100% Genuine Products</p>
                        </div>
                        <div className="text-center w-1/3 px-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                                <RotateCcw className="w-4 h-4 text-gray-600" />
                            </div>
                            <p className="text-[10px] text-gray-500">7 Days Return & Exchange</p>
                        </div>
                    </div>

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {product.tags.map((tag: string) => (
                                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{tag}</span>
                            ))}
                        </div>
                    )}

                    {/* Device Compatibility */}
                    {compatibility.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h3 className="font-semibold text-sm uppercase tracking-wide">Compatible Devices</h3>
                            <DeviceCompatibility devices={compatibility} />
                        </div>
                    )}

                    {/* Description Tabs */}
                    <div className="mt-8">
                        <Tabs defaultValue="desc" className="w-full">
                            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6 overflow-x-auto">
                                <TabsTrigger value="desc" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38508] data-[state=active]:text-black data-[state=active]:shadow-none px-0 py-3 text-gray-500 whitespace-nowrap">
                                    Description
                                </TabsTrigger>
                                {product.highlights && product.highlights.length > 0 && (
                                    <TabsTrigger value="highlights" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38508] data-[state=active]:text-black data-[state=active]:shadow-none px-0 py-3 text-gray-500 whitespace-nowrap">
                                        Highlights
                                    </TabsTrigger>
                                )}
                                {product.specificationsJson && (
                                    <TabsTrigger value="specs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38508] data-[state=active]:text-black data-[state=active]:shadow-none px-0 py-3 text-gray-500 whitespace-nowrap">
                                        Specifications
                                    </TabsTrigger>
                                )}
                                {hasSizeFitTab && (
                                    <TabsTrigger value="sizefit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38508] data-[state=active]:text-black data-[state=active]:shadow-none px-0 py-3 text-gray-500 whitespace-nowrap">
                                        Size &amp; Fit
                                    </TabsTrigger>
                                )}
                                <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38508] data-[state=active]:text-black data-[state=active]:shadow-none px-0 py-3 text-gray-500 whitespace-nowrap">
                                    Reviews ({product.reviews?.length ?? product.reviewCount ?? 0})
                                </TabsTrigger>
                                <TabsTrigger value="qna" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38508] data-[state=active]:text-black data-[state=active]:shadow-none px-0 py-3 text-gray-500 whitespace-nowrap">
                                    Q&amp;A ({questions.length})
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="desc" className="pt-4 text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                {product.description}

                                <div className="grid grid-cols-2 gap-4 mt-6 bg-gray-50 p-4 rounded">
                                    {categoryName && (
                                        <div>
                                            <b className="text-gray-900 block mb-1">Category</b>
                                            <p className="text-xs">{categoryName}</p>
                                        </div>
                                    )}
                                    {(product.brandName || product.brand) && !/^[0-9a-f-]{36}$/i.test(product.brandName || product.brand) && (
                                        <div>
                                            <b className="text-gray-900 block mb-1">Brand</b>
                                            <p className="text-xs">{product.brandName || product.brand}</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                            {product.highlights && product.highlights.length > 0 && (
                                <TabsContent value="highlights" className="pt-4">
                                    <ul className="space-y-2">
                                        {product.highlights.map((h: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#F38508] flex-shrink-0" />
                                                {h}
                                            </li>
                                        ))}
                                    </ul>
                                </TabsContent>
                            )}
                            {product.specificationsJson && (
                                <TabsContent value="specs" className="pt-4">
                                    <SpecificationsTable json={product.specificationsJson} />
                                </TabsContent>
                            )}
                            {hasSizeFitTab && (
                                <TabsContent value="sizefit" className="pt-4 space-y-6">
                                    {fitGuide && (
                                        <div>
                                            <h4 className="font-semibold text-sm mb-3">Size Chart</h4>
                                            <FitGuide fitGuide={fitGuide} />
                                        </div>
                                    )}
                                    {careInstructions.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2">Care Instructions</h4>
                                            <ul className="space-y-1.5">
                                                {careInstructions.map((c, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#F38508] flex-shrink-0" />
                                                        {c}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </TabsContent>
                            )}
                            <TabsContent value="reviews" className="pt-4">
                                <ReviewSummary productId={product.id ?? product._id} />
                                <ReviewSection productId={product._id} reviews={product.reviews || []} />
                            </TabsContent>
                            <TabsContent value="qna" className="pt-4">
                                <QnaSection productId={product._id} questions={questions} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Recommended Products via Relations */}
            {recommended.length > 0 && (
                <div className="mt-16">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Top Picks For You</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
                        {recommended.map((r: any) => {
                            const p = r.targetProduct;
                            if (!p) return null;
                            // Map to format ProductCard expects
                            const mappedProduct = {
                                _id: p.id,
                                id: p.id,
                                slug: p.slug,
                                title: p.title,
                                name: p.title,
                                images: p.images,
                                price: p.variants?.[0]?.priceMinor ? Number(p.variants[0].priceMinor) / 100 : 0,
                                originalPrice: p.variants?.[0]?.compareAtMinor ? Number(p.variants[0].compareAtMinor) / 100 : 0,
                            };
                            return <ProductCard key={r.id} product={mappedProduct} />;
                        })}
                    </div>
                </div>
            )}

            {/* Related Products Section (Fallback) */}
            {recommended.length === 0 && relatedProducts.length > 0 && (
                <div className="mt-16">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
                        {relatedProducts.map((p: any) => (
                            <ProductCard key={p._id} product={p} />
                        ))}
                    </div>
                </div>
            )}

            {/* AI Recommendations */}
            <AiProductRecs productId={product.id ?? product._id} />

            {/* Recently Viewed */}
            <div className="mt-4 border-t border-gray-100 pt-8">
                <RecentlyViewedStrip excludeId={product.id ?? product._id} />
            </div>

            <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Share this product</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center gap-4 py-6">
                        <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${product.name ?? product.title} on Baefikra! ` + (typeof window !== 'undefined' ? window.location.href : ''))}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-gray-600 hover:text-green-600">
                            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium">WhatsApp</span>
                        </a>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-gray-600 hover:text-blue-600">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                                <Facebook className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium">Facebook</span>
                        </a>
                        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${product.name ?? product.title} on Baefikra!`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-gray-600 hover:text-sky-500">
                            <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center">
                                <Twitter className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium">Twitter</span>
                        </a>
                        <button onClick={copyLink} className="flex flex-col items-center gap-2 text-gray-600 hover:text-gray-900">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                <Copy className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium">Copy</span>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function AiProductRecs({ productId }: { productId: string }) {
    const [recs, setRecs] = useState<any[]>([])
    useEffect(() => {
        aiProductRecommendations(productId).then(setRecs).catch(() => undefined)
    }, [productId])
    if (recs.length === 0) return null
    return (
        <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="text-[#F38508]">✨</span> AI Picks For You
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

function Separator({ className }: { className?: string }) {
    return <div className={`h-[1px] w-full ${className}`} />
}

function SpecificationsTable({ json }: { json: string }) {
    let specs: Record<string, string> = {}
    try { specs = JSON.parse(json) } catch { return null }
    const entries = Object.entries(specs)
    if (entries.length === 0) return null
    return (
        <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
                <tbody>
                    {entries.map(([key, val], i) => (
                        <tr key={key} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td className="px-4 py-2.5 font-medium text-gray-700 w-2/5 capitalize">{key.replace(/_/g, " ")}</td>
                            <td className="px-4 py-2.5 text-gray-600">{val}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
