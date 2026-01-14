import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"
import { Referral } from "@/models/Referral"
import { resolveUserId } from "@/lib/auth-utils"

// GET: Get user's referral info and history
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)

        // Get user's referral code
        const user = await User.findById(userId).select("affiliateCode name")

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get referral stats
        const [referrals, stats] = await Promise.all([
            Referral.find({ referrer: userId })
                .populate("referred", "name email")
                .sort({ createdAt: -1 })
                .limit(50),
            Referral.aggregate([
                { $match: { referrer: user._id } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                        totalEarned: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "completed"] },
                                    "$referrerReward.value",
                                    0
                                ]
                            }
                        }
                    }
                }
            ])
        ])

        const referralStats = stats[0] || { total: 0, completed: 0, pending: 0, totalEarned: 0 }

        // Format referrals for frontend
        const formattedReferrals = referrals.map(r => ({
            _id: r._id,
            referredUser: {
                name: r.referred?.name || "User",
                email: r.referred?.email || ""
            },
            status: r.status,
            reward: r.referrerReward?.value || 100,
            createdAt: r.createdAt
        }))

        return NextResponse.json({
            referralCode: user.affiliateCode || `BKC${userId.toString().slice(-6).toUpperCase()}`,
            referrals: formattedReferrals,
            totalEarned: referralStats.totalEarned,
            stats: {
                total: referralStats.total,
                completed: referralStats.completed,
                pending: referralStats.pending
            }
        })
    } catch (error: any) {
        console.error("Referral fetch error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: Apply referral code during signup
export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const { referralCode, userId } = await request.json()

        if (!referralCode || !userId) {
            return NextResponse.json({ error: "Missing referral code or user ID" }, { status: 400 })
        }

        // Find referrer by affiliate code
        const referrer = await User.findOne({
            affiliateCode: referralCode.toUpperCase()
        })

        if (!referrer) {
            return NextResponse.json({ error: "Invalid referral code" }, { status: 404 })
        }

        // Check if user is trying to refer themselves
        if (referrer._id.toString() === userId) {
            return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 })
        }

        // Check if user was already referred
        const existingReferral = await Referral.findOne({ referred: userId })
        if (existingReferral) {
            return NextResponse.json({ error: "User already referred" }, { status: 400 })
        }

        // Create referral record
        const referral = await Referral.create({
            referrer: referrer._id,
            referred: userId,
            referralCode: referralCode.toUpperCase(),
            status: "pending",
            rewardType: "points",
            referrerReward: {
                type: "points",
                value: 100,
                claimed: false
            },
            referredReward: {
                type: "discount",
                value: 100, // ₹100 off first order
                claimed: false
            }
        })

        return NextResponse.json({
            message: "Referral applied successfully",
            discount: 100, // ₹100 off first order
            referral
        }, { status: 201 })
    } catch (error: any) {
        console.error("Referral apply error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
