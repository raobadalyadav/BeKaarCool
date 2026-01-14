"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Gift, Copy, Check, Share2, Users, IndianRupee, MessageCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Referral {
    _id: string
    referredUser: {
        name: string
        email: string
    }
    status: "pending" | "completed"
    reward: number
    createdAt: string
}

export default function ReferralPage() {
    const { data: session } = useSession()
    const { toast } = useToast()

    const [referralCode, setReferralCode] = useState("")
    const [referrals, setReferrals] = useState<Referral[]>([])
    const [totalEarned, setTotalEarned] = useState(0)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        fetchReferralData()
    }, [])

    const fetchReferralData = async () => {
        try {
            const res = await fetch("/api/referral")
            if (res.ok) {
                const data = await res.json()
                setReferralCode(data.referralCode || session?.user?.id?.slice(-6).toUpperCase() || "BEKAAR")
                setReferrals(data.referrals || [])
                setTotalEarned(data.totalEarned || 0)
            }
        } catch (error) {
            // Use session-based fallback
            setReferralCode(session?.user?.id?.slice(-6).toUpperCase() || "BEKAAR")
        }
    }

    const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${referralCode}`

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink)
        setCopied(true)
        toast({ title: "Referral link copied!" })
        setTimeout(() => setCopied(false), 3000)
    }

    const shareToWhatsApp = () => {
        const text = `Hey! Use my referral code ${referralCode} to get ₹100 off on your first order at BeKaarCool! ${referralLink}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Refer & Earn</h1>

            {/* Hero Card */}
            <Card className="overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white">
                <CardContent className="py-8">
                    <div className="text-center">
                        <Gift className="w-16 h-16 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Invite Friends, Earn Rewards!</h2>
                        <p className="opacity-90 mb-6">
                            Get ₹100 for every friend who makes their first purchase
                        </p>

                        {/* Referral Code Box */}
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4 max-w-md mx-auto">
                            <p className="text-sm opacity-80 mb-2">Your Referral Code</p>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={referralCode}
                                    readOnly
                                    className="bg-white text-black font-mono font-bold text-center text-lg"
                                />
                                <Button
                                    onClick={copyLink}
                                    className={copied ? "bg-green-500" : "bg-white text-purple-600 hover:bg-gray-100"}
                                >
                                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Share Buttons */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Share2 className="w-5 h-5" /> Share Your Link
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={shareToWhatsApp}
                            className="bg-green-500 hover:bg-green-600 text-white"
                        >
                            <MessageCircle className="w-4 h-4 mr-2" /> Share on WhatsApp
                        </Button>
                        <Button
                            variant="outline"
                            onClick={copyLink}
                        >
                            <Copy className="w-4 h-4 mr-2" /> Copy Link
                        </Button>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 break-all">{referralLink}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="py-6 text-center">
                        <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{referrals.length}</p>
                        <p className="text-sm text-gray-500">Friends Referred</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-6 text-center">
                        <IndianRupee className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">₹{totalEarned}</p>
                        <p className="text-sm text-gray-500">Total Earned</p>
                    </CardContent>
                </Card>
            </div>

            {/* How it Works */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">How It Works</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold flex-shrink-0">
                                1
                            </div>
                            <div>
                                <p className="font-semibold">Share your referral link</p>
                                <p className="text-sm text-gray-500">Send your unique link to friends via WhatsApp, SMS, or social media</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold flex-shrink-0">
                                2
                            </div>
                            <div>
                                <p className="font-semibold">Friend signs up & shops</p>
                                <p className="text-sm text-gray-500">They get ₹100 off on their first order using your code</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold flex-shrink-0">
                                3
                            </div>
                            <div>
                                <p className="font-semibold">You earn ₹100!</p>
                                <p className="text-sm text-gray-500">Get credited to your wallet after their order is delivered</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Referral History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Referral History</CardTitle>
                </CardHeader>
                <CardContent>
                    {referrals.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No referrals yet</p>
                            <p className="text-sm">Start inviting friends to earn rewards!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {referrals.map(ref => (
                                <div key={ref._id} className="flex items-center justify-between py-3 border-b last:border-0">
                                    <div>
                                        <p className="font-medium">{ref.referredUser.name}</p>
                                        <p className="text-sm text-gray-500">{formatDate(ref.createdAt)}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge className={ref.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                                            {ref.status === "completed" ? "Completed" : "Pending"}
                                        </Badge>
                                        {ref.status === "completed" && (
                                            <p className="text-sm font-semibold text-green-600 mt-1">+₹{ref.reward}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
