"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Percent, Tag, Clock, Copy, Check, Zap, Gift, ChevronRight, Home
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Coupon {
    _id: string
    code: string
    description: string
    discountType: "percentage" | "fixed"
    discountValue: number
    minOrderValue: number
    maxDiscount?: number
    validUntil: string
    usageLimit?: number
    usedCount: number
}

interface Offer {
    _id: string
    title: string
    description: string
    image?: string
    discountText: string
    link: string
    validUntil?: string
    isFlashSale: boolean
}

export default function OffersClient() {
    const { toast } = useToast()
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [offers, setOffers] = useState<Offer[]>([])
    const [loading, setLoading] = useState(true)
    const [copiedCode, setCopiedCode] = useState<string | null>(null)

    useEffect(() => {
        fetchOffers()
    }, [])

    const fetchOffers = async () => {
        try {
            const [couponsRes, offersRes] = await Promise.all([
                fetch("/api/coupons/public"),
                fetch("/api/offers")
            ])

            if (couponsRes.ok) {
                const data = await couponsRes.json()
                setCoupons(data.coupons || [])
            }

            if (offersRes.ok) {
                const data = await offersRes.json()
                setOffers(data.offers || [])
            }
        } catch (error) {
            console.error("Failed to fetch offers:", error)
        } finally {
            setLoading(false)
        }
    }

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        setCopiedCode(code)
        toast({ title: "Coupon code copied!", description: code })
        setTimeout(() => setCopiedCode(null), 3000)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })
    }

    // Use only API data - no fallbacks
    const displayOffers = offers

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumbs */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-3">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-yellow-600">
                            <Home className="w-4 h-4" />
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">Offers & Deals</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Offers & Deals</h1>
                    <p className="text-gray-600">Grab the best deals and save big on your orders!</p>
                </div>

                <Tabs defaultValue="deals" className="space-y-6">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                        <TabsTrigger value="deals" className="gap-2">
                            <Zap className="w-4 h-4" /> Deals
                        </TabsTrigger>
                        <TabsTrigger value="coupons" className="gap-2">
                            <Tag className="w-4 h-4" /> Coupons
                        </TabsTrigger>
                    </TabsList>

                    {/* Deals Tab */}
                    <TabsContent value="deals">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} className="h-48 w-full rounded-lg" />
                                ))}
                            </div>
                        ) : displayOffers.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700">No active deals right now</h3>
                                    <p className="text-gray-500 mt-2">Check back later for exciting offers!</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayOffers.map(offer => (
                                    <Card
                                        key={offer._id}
                                        className={`overflow-hidden hover:shadow-lg transition-shadow ${offer.isFlashSale ? "border-2 border-red-400" : ""
                                            }`}
                                    >
                                        {offer.image && (
                                            <div className="h-32 relative">
                                                <Image src={offer.image} alt={offer.title} fill className="object-cover" />
                                            </div>
                                        )}
                                        <CardContent className="p-6">
                                            {offer.isFlashSale && (
                                                <Badge className="bg-red-500 text-white mb-2">
                                                    <Zap className="w-3 h-3 mr-1" /> Flash Sale
                                                </Badge>
                                            )}
                                            <div className="text-2xl font-bold text-yellow-600 mb-2">
                                                {offer.discountText}
                                            </div>
                                            <h3 className="font-semibold text-gray-900 mb-1">{offer.title}</h3>
                                            <p className="text-sm text-gray-500 mb-4">{offer.description}</p>

                                            {offer.validUntil && (
                                                <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Valid till {formatDate(offer.validUntil)}
                                                </p>
                                            )}

                                            <Link href={offer.link}>
                                                <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
                                                    Shop Now
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Coupons Tab */}
                    <TabsContent value="coupons">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <Skeleton key={i} className="h-32 w-full rounded-lg" />
                                ))}
                            </div>
                        ) : coupons.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700">No coupons available</h3>
                                    <p className="text-gray-500 mt-2">Check back later for new coupon codes!</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {coupons.map(coupon => (
                                    <Card key={coupon._id} className="overflow-hidden">
                                        <CardContent className="p-0 flex">
                                            {/* Left side - discount badge */}
                                            <div className="w-28 flex-shrink-0 bg-gradient-to-b from-yellow-400 to-yellow-500 flex flex-col items-center justify-center text-black p-4">
                                                <Percent className="w-6 h-6 mb-1" />
                                                <span className="text-2xl font-bold">
                                                    {coupon.discountType === "percentage"
                                                        ? `${coupon.discountValue}%`
                                                        : `₹${coupon.discountValue}`
                                                    }
                                                </span>
                                                <span className="text-xs">OFF</span>
                                            </div>

                                            {/* Right side - details */}
                                            <div className="flex-1 p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-mono font-bold text-lg">{coupon.code}</span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => copyCode(coupon.code)}
                                                        className={copiedCode === coupon.code ? "bg-green-50 border-green-500" : ""}
                                                    >
                                                        {copiedCode === coupon.code ? (
                                                            <><Check className="w-4 h-4 mr-1 text-green-600" /> Copied</>
                                                        ) : (
                                                            <><Copy className="w-4 h-4 mr-1" /> Copy</>
                                                        )}
                                                    </Button>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
                                                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                                    <span>Min order: ₹{coupon.minOrderValue}</span>
                                                    {coupon.maxDiscount && <span>• Max discount: ₹{coupon.maxDiscount}</span>}
                                                    <span>• Valid till {formatDate(coupon.validUntil)}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Referral Banner */}
                <Card className="mt-12 bg-gradient-to-r from-purple-600 to-pink-500 text-white overflow-hidden">
                    <CardContent className="py-8 px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <Gift className="w-12 h-12" />
                            <div>
                                <h3 className="text-xl font-bold">Refer & Earn</h3>
                                <p className="text-purple-100">Invite friends and earn ₹100 for each successful referral!</p>
                            </div>
                        </div>
                        <Link href="/account/referral">
                            <Button className="bg-white text-purple-600 hover:bg-purple-50 font-bold">
                                Start Referring →
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
