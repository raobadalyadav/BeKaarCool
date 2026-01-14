"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, ShoppingBag, Heart, Truck, Shield, RotateCcw, MapPin, Ruler, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ReviewSection } from "@/components/product/review-section"
import { ProductCard } from "@/components/product/product-card"
import { useSession } from "next-auth/react"

interface ProductDetailClientProps {
    product: any
    relatedProducts?: any[]
}

import { useAppDispatch } from "@/store"
import { addToCartLocal, fetchCart } from "@/store/slices/cart-slice"

export default function ProductDetailClient({ product, relatedProducts = [] }: ProductDetailClientProps) {
    const [selectedImage, setSelectedImage] = useState(0)
    const [selectedSize, setSelectedSize] = useState("")
    const [selectedColor, setSelectedColor] = useState(product.variations?.colors?.[0]?.name || "")
    const [quantity, setQuantity] = useState(1)
    const [isWishlisted, setIsWishlisted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [wishlistLoading, setWishlistLoading] = useState(false)
    const [pincode, setPincode] = useState("")
    const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null)

    const { toast } = useToast()
    const dispatch = useAppDispatch()
    const { data: session } = useSession()

    const handleAddToCart = async () => {
        if (!selectedSize) {
            toast({
                title: "Please select a size",
                description: "Choose your size before adding to bag",
                variant: "destructive"
            })
            return
        }

        setLoading(true)
        try {
            const response = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: product._id,
                    quantity,
                    size: selectedSize,
                    color: selectedColor,
                }),
            })

            if (response.ok) {
                toast({
                    title: "Added to Bag!",
                    description: `${product.name} has been added to your cart.`,
                })
                dispatch(fetchCart())
            } else {
                throw new Error("Failed to add to cart")
            }
        } catch (error) {
            // Fallback for guest users
            dispatch(addToCartLocal({
                productId: product._id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice,
                image: images[0],
                quantity,
                size: selectedSize,
                color: selectedColor
            }))

            toast({
                title: "Added to Bag!",
                description: `${product.name} has been added to your bag.`,
            })
        } finally {
            setLoading(false)
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
            const method = isWishlisted ? "DELETE" : "POST"
            const response = await fetch("/api/wishlist", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product._id }),
            })

            if (response.ok) {
                setIsWishlisted(!isWishlisted)
                toast({
                    title: isWishlisted ? "Removed from Wishlist" : "Added to Wishlist",
                    description: isWishlisted
                        ? `${product.name} removed from your wishlist`
                        : `${product.name} added to your wishlist`,
                })
            }
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
            const response = await fetch(`/api/pincode?code=${pincode}`)
            const data = await response.json()

            if (data.serviceable) {
                setDeliveryInfo(`Delivery available! Expected by ${data.estimatedDays || "3-5"} days`)
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

    const images = product.images && product.images.length > 0 ? product.images : ["/placeholder.svg"]
    const sizes = product.variations?.sizes || ["S", "M", "L", "XL", "XXL"]
    const colors = product.variations?.colors || []
    const categoryName = typeof product.category === 'object' ? product.category.name : product.category

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                {/* Left Column: Image Gallery */}
                <div className="w-full lg:w-[58%] flex flex-col-reverse lg:flex-row gap-4 h-fit lg:sticky lg:top-24">
                    {/* Thumbnails (Vertical on Desktop) */}
                    <div className="hidden lg:flex flex-col gap-4 w-20 flex-shrink-0 h-[600px] overflow-y-auto no-scrollbar">
                        {images.map((img: string, idx: number) => (
                            <div
                                key={idx}
                                className={`aspect-[3/4] relative cursor-pointer border-2 rounded transition-all ${selectedImage === idx ? 'border-yellow-400' : 'border-transparent hover:border-gray-300'}`}
                                onMouseEnter={() => setSelectedImage(idx)}
                            >
                                <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover rounded-sm" />
                            </div>
                        ))}
                    </div>

                    {/* Main Image */}
                    <div className="flex-1 relative aspect-[3/4] lg:h-[600px] bg-gray-50 rounded-lg overflow-hidden">
                        <Image
                            src={images[selectedImage]}
                            alt={product.name}
                            fill
                            className="object-contain lg:object-cover transition-opacity duration-300"
                            priority
                        />

                        {discountPercentage > 0 && (
                            <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                                {discountPercentage}% OFF
                            </div>
                        )}

                        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1 text-sm font-semibold shadow-sm">
                            {product.rating?.toFixed(1) || "4.0"} <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> | {product.reviewCount || 0}
                        </div>
                    </div>

                    {/* Mobile Thumbnails (Horizontal) */}
                    <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {images.map((img: string, idx: number) => (
                            <div
                                key={idx}
                                className={`relative w-16 h-20 flex-shrink-0 border-2 rounded ${selectedImage === idx ? 'border-yellow-400' : 'border-gray-200'}`}
                                onClick={() => setSelectedImage(idx)}
                            >
                                <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover rounded-sm" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Product Details */}
                <div className="w-full lg:w-[42%] space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-500 mb-1">{product.brand || "BeKaarCool"}</h3>
                        <h1 className="text-xl md:text-2xl font-normal text-gray-800 leading-snug mb-2">{product.name}</h1>

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
                                {colors.map((color: any) => (
                                    <button
                                        key={color.name}
                                        onClick={() => setSelectedColor(color.name)}
                                        className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color.name
                                                ? 'border-black ring-2 ring-offset-2 ring-black'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        style={{ backgroundColor: color.code }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                            {selectedColor && <p className="text-sm text-gray-600 mt-2">{selectedColor}</p>}
                        </div>
                    )}

                    {/* Sizes */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-sm uppercase tracking-wide">Select Size</h3>
                            <Link href="/size-guide" className="text-teal-600 text-sm font-semibold flex items-center gap-1 hover:underline">
                                <Ruler className="w-4 h-4" /> Size Guide
                            </Link>
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

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-12 text-sm uppercase tracking-wider"
                            onClick={handleAddToCart}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <ShoppingBag className="w-4 h-4 mr-2" />
                            )}
                            {loading ? "Adding..." : "Add to Bag"}
                        </Button>
                        <Button
                            variant="outline"
                            className={`h-12 px-6 border-gray-300 ${isWishlisted ? 'text-red-500 border-red-200 bg-red-50' : 'text-gray-600'}`}
                            onClick={handleWishlist}
                            disabled={wishlistLoading}
                        >
                            {wishlistLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                            )}
                            <span className="ml-2 font-semibold uppercase text-sm hidden sm:inline">Wishlist</span>
                        </Button>
                    </div>

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

                    {/* Description Tabs */}
                    <div className="mt-8">
                        <Tabs defaultValue="desc" className="w-full">
                            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                                <TabsTrigger value="desc" className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-400 data-[state=active]:text-black data-[state=active]:shadow-none px-0 py-3 text-gray-500">
                                    Description
                                </TabsTrigger>
                                <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-400 data-[state=active]:text-black data-[state=active]:shadow-none px-0 py-3 text-gray-500">
                                    Reviews ({product.reviewCount || 0})
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="desc" className="pt-4 text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                {product.description}

                                <div className="grid grid-cols-2 gap-4 mt-6 bg-gray-50 p-4 rounded">
                                    <div>
                                        <b className="text-gray-900 block mb-1">Product Details</b>
                                        <p className="text-xs">{categoryName} | {product.brand || "BeKaarCool"}</p>
                                    </div>
                                    <div>
                                        <b className="text-gray-900 block mb-1">Material</b>
                                        <p className="text-xs">100% Cotton</p>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="reviews" className="pt-4">
                                <ReviewSection productId={product._id} reviews={product.reviews || []} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
                <div className="mt-16">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
                        {relatedProducts.map((p: any) => (
                            <ProductCard key={p._id} product={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function Separator({ className }: { className?: string }) {
    return <div className={`h-[1px] w-full ${className}`} />
}
