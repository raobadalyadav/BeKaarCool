"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Gift, Star, Crown, Zap, TrendingUp, History, ChevronRight
} from "lucide-react"

interface RewardTransaction {
    _id: string
    type: "earned" | "redeemed"
    points: number
    description: string
    createdAt: string
}

const tiers = [
    { name: "Bronze", minPoints: 0, maxPoints: 499, color: "bg-amber-600", icon: Star },
    { name: "Silver", minPoints: 500, maxPoints: 1499, color: "bg-gray-400", icon: Star },
    { name: "Gold", minPoints: 1500, maxPoints: 2999, color: "bg-yellow-400", icon: Crown },
    { name: "Platinum", minPoints: 3000, maxPoints: Infinity, color: "bg-purple-500", icon: Crown }
]

export default function RewardsPage() {
    const { data: session } = useSession()
    const [points, setPoints] = useState(0)
    const [transactions, setTransactions] = useState<RewardTransaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRewards()
    }, [])

    const fetchRewards = async () => {
        try {
            const res = await fetch("/api/rewards")
            if (res.ok) {
                const data = await res.json()
                setPoints(data.points || 0)
                setTransactions(data.transactions || [])
            }
        } catch (error) {
            console.error("Failed to fetch rewards:", error)
        } finally {
            setLoading(false)
        }
    }

    const currentTier = tiers.find(t => points >= t.minPoints && points <= t.maxPoints) || tiers[0]
    const nextTier = tiers[tiers.indexOf(currentTier) + 1]
    const progressToNext = nextTier
        ? ((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
        : 100

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })
    }

    const TierIcon = currentTier.icon

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">My Rewards</h1>

            {/* Points Balance Card */}
            <Card className="overflow-hidden">
                <div className={`${currentTier.color} p-6 text-white`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Available Points</p>
                            <p className="text-4xl font-bold mt-1">{points.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <Badge className="bg-white/20 text-white mb-2">
                                <TierIcon className="w-4 h-4 mr-1" />
                                {currentTier.name} Member
                            </Badge>
                        </div>
                    </div>
                </div>

                {nextTier && (
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-500">Progress to {nextTier.name}</span>
                            <span className="font-semibold">{nextTier.minPoints - points} points to go</span>
                        </div>
                        <Progress value={progressToNext} className="h-2" />
                    </CardContent>
                )}
            </Card>

            {/* Tier Benefits */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Crown className="w-5 h-5 text-yellow-500" /> Membership Tiers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {tiers.map((tier, idx) => {
                            const isCurrentTier = tier.name === currentTier.name
                            return (
                                <div
                                    key={tier.name}
                                    className={`p-4 rounded-lg text-center ${isCurrentTier ? "ring-2 ring-yellow-400 bg-yellow-50" : "bg-gray-50"
                                        }`}
                                >
                                    <div className={`w-10 h-10 ${tier.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                                        <tier.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="font-semibold">{tier.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {tier.maxPoints === Infinity ? `${tier.minPoints}+` : `${tier.minPoints}-${tier.maxPoints}`} pts
                                    </p>
                                    {isCurrentTier && (
                                        <Badge className="mt-2 bg-yellow-400 text-black text-xs">Current</Badge>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* How to Earn */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" /> How to Earn Points
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700">Every ₹100 spent</span>
                            <Badge variant="secondary">+10 points</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700">Write a product review</span>
                            <Badge variant="secondary">+50 points</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700">Successful referral</span>
                            <Badge variant="secondary">+100 points</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700">Birthday bonus</span>
                            <Badge variant="secondary">+200 points</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-500" /> Points History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Gift className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No transactions yet</p>
                            <p className="text-sm">Start shopping to earn points!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map(tx => (
                                <div key={tx._id} className="flex items-center justify-between py-3 border-b last:border-0">
                                    <div>
                                        <p className="font-medium">{tx.description}</p>
                                        <p className="text-sm text-gray-500">{formatDate(tx.createdAt)}</p>
                                    </div>
                                    <span className={`font-bold ${tx.type === "earned" ? "text-green-600" : "text-red-600"}`}>
                                        {tx.type === "earned" ? "+" : "-"}{tx.points}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Redeem Button */}
            <Card className="bg-gradient-to-r from-yellow-400 to-orange-400">
                <CardContent className="py-6 flex items-center justify-between">
                    <div className="text-black">
                        <h3 className="font-bold text-lg">Redeem Your Points</h3>
                        <p className="text-sm opacity-80">100 points = ₹10 discount</p>
                    </div>
                    <Button className="bg-black text-white hover:bg-gray-800 font-bold">
                        Redeem Now
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
