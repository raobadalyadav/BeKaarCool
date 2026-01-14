import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"
import { WalletTransaction } from "@/models/WalletTransaction"
import { resolveUserId } from "@/lib/auth-utils"

// GET: Get wallet balance and transactions
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")

        // Get user's wallet balance
        const user = await User.findById(userId).select("walletBalance")

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get transactions
        const skip = (page - 1) * limit
        const [transactions, total] = await Promise.all([
            WalletTransaction.find({ user: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            WalletTransaction.countDocuments({ user: userId })
        ])

        return NextResponse.json({
            balance: user.walletBalance || 0,
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error: any) {
        console.error("Wallet fetch error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: Redeem gift card or add balance
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)
        const { action, giftCardCode } = await request.json()

        if (action === "redeem_giftcard") {
            if (!giftCardCode) {
                return NextResponse.json({ error: "Gift card code is required" }, { status: 400 })
            }

            const result = await WalletTransaction.redeemGiftCard(userId, giftCardCode)

            if (!result.success) {
                return NextResponse.json({ error: result.error }, { status: 400 })
            }

            // Get updated balance
            const user = await User.findById(userId).select("walletBalance")

            return NextResponse.json({
                message: `₹${result.amount} added to wallet!`,
                amount: result.amount,
                balance: user?.walletBalance || 0
            })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    } catch (error: any) {
        console.error("Wallet POST error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
