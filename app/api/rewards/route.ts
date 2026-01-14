import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"
import { RewardTransaction } from "@/models/RewardTransaction"
import { resolveUserId } from "@/lib/auth-utils"

// GET: Get user's reward points and transaction history
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

        // Get user's points and tier
        const user = await User.findById(userId).select("loyaltyPoints loyaltyTier totalSpent")

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get transaction history
        const skip = (page - 1) * limit
        const [transactions, total] = await Promise.all([
            RewardTransaction.find({ user: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            RewardTransaction.countDocuments({ user: userId })
        ])

        return NextResponse.json({
            points: user.loyaltyPoints || 0,
            tier: user.loyaltyTier || "bronze",
            totalSpent: user.totalSpent || 0,
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error: any) {
        console.error("Rewards fetch error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: Redeem points
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)
        const { points, orderId } = await request.json()

        if (!points || points <= 0) {
            return NextResponse.json({ error: "Invalid points amount" }, { status: 400 })
        }

        // Check if user has enough points
        const user = await User.findById(userId)
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        if ((user.loyaltyPoints || 0) < points) {
            return NextResponse.json({
                error: "Insufficient points",
                available: user.loyaltyPoints || 0
            }, { status: 400 })
        }

        // Deduct points
        user.loyaltyPoints -= points
        await user.save()

        // Create transaction record
        const transaction = await RewardTransaction.create({
            user: userId,
            type: "redeemed",
            points,
            balance: user.loyaltyPoints,
            description: orderId ? "Redeemed for order discount" : "Points redeemed",
            source: "redemption",
            orderId
        })

        // Calculate discount value (100 points = ₹10)
        const discountValue = Math.floor(points / 10)

        return NextResponse.json({
            message: "Points redeemed successfully",
            pointsRedeemed: points,
            discountValue,
            remainingPoints: user.loyaltyPoints,
            transaction
        })
    } catch (error: any) {
        console.error("Points redeem error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
