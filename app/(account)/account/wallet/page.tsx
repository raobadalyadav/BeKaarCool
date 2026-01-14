"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
    Wallet, Gift, ArrowDownCircle, ArrowUpCircle, History, ChevronLeft, ChevronRight
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
    _id: string
    type: "credit" | "debit" | "refund" | "giftcard" | "cashback"
    amount: number
    balance: number
    description: string
    source: string
    createdAt: string
}

export default function WalletPage() {
    const { toast } = useToast()
    const [balance, setBalance] = useState(0)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [giftCode, setGiftCode] = useState("")
    const [redeeming, setRedeeming] = useState(false)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)

    useEffect(() => {
        fetchWallet()
    }, [page])

    const fetchWallet = async () => {
        try {
            const res = await fetch(`/api/wallet?page=${page}&limit=10`)
            if (res.ok) {
                const data = await res.json()
                setBalance(data.balance || 0)
                setTransactions(data.transactions || [])
                setTotalPages(data.pagination?.pages || 0)
            }
        } catch (error) {
            console.error("Failed to fetch wallet:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleRedeemGiftCard = async () => {
        if (!giftCode.trim()) {
            toast({ title: "Please enter a gift card code", variant: "destructive" })
            return
        }

        setRedeeming(true)
        try {
            const res = await fetch("/api/wallet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "redeem_giftcard",
                    giftCardCode: giftCode.toUpperCase()
                })
            })

            const data = await res.json()

            if (res.ok) {
                toast({ title: data.message })
                setBalance(data.balance)
                setGiftCode("")
                fetchWallet() // Refresh transactions
            } else {
                toast({ title: data.error || "Failed to redeem", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Failed to redeem gift card", variant: "destructive" })
        } finally {
            setRedeeming(false)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case "credit":
            case "giftcard":
            case "cashback":
            case "refund":
                return <ArrowDownCircle className="w-5 h-5 text-green-500" />
            case "debit":
                return <ArrowUpCircle className="w-5 h-5 text-red-500" />
            default:
                return <Wallet className="w-5 h-5 text-gray-500" />
        }
    }

    const getTransactionColor = (type: string) => {
        switch (type) {
            case "credit":
            case "giftcard":
            case "cashback":
            case "refund":
                return "text-green-600"
            case "debit":
                return "text-red-600"
            default:
                return "text-gray-600"
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>

            {/* Balance Card */}
            <Card className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black">
                <CardContent className="py-8">
                    <div className="flex items-center gap-4">
                        <Wallet className="w-12 h-12" />
                        <div>
                            <p className="text-sm opacity-80">Available Balance</p>
                            <p className="text-4xl font-bold">₹{balance.toLocaleString("en-IN")}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Gift Card Redemption */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-pink-500" /> Redeem Gift Card
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter 16-character gift card code"
                            value={giftCode}
                            onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                            maxLength={16}
                            className="flex-1 font-mono uppercase"
                        />
                        <Button
                            onClick={handleRedeemGiftCard}
                            disabled={redeeming || giftCode.length < 16}
                            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                        >
                            {redeeming ? "Redeeming..." : "Redeem"}
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Gift card codes are 16 alphanumeric characters
                    </p>
                </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-500" /> Transaction History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Wallet className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No transactions yet</p>
                            <p className="text-sm">Your wallet transactions will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map(tx => (
                                <div key={tx._id} className="flex items-center justify-between py-3 border-b last:border-0">
                                    <div className="flex items-center gap-3">
                                        {getTransactionIcon(tx.type)}
                                        <div>
                                            <p className="font-medium">{tx.description}</p>
                                            <p className="text-sm text-gray-500">{formatDate(tx.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${getTransactionColor(tx.type)}`}>
                                            {tx.type === "debit" ? "-" : "+"}₹{tx.amount}
                                        </p>
                                        <p className="text-xs text-gray-500">Bal: ₹{tx.balance}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 pt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-sm text-gray-600">
                                        Page {page} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === totalPages}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
