/**
 * Referral Model
 * For tracking referral program and affiliate commissions
 */

import mongoose, { Document, Model } from "mongoose"

export interface IReferral extends Document {
    referrer: mongoose.Types.ObjectId
    referred: mongoose.Types.ObjectId
    referralCode: string
    status: "pending" | "completed" | "expired" | "cancelled"
    rewardType: "points" | "discount" | "cashback"
    referrerReward: {
        type: string
        value: number
        claimed: boolean
        claimedAt?: Date
        expiresAt?: Date
    }
    referredReward: {
        type: string
        value: number
        claimed: boolean
        claimedAt?: Date
        expiresAt?: Date
    }
    qualifyingOrder?: mongoose.Types.ObjectId
    orderAmount?: number
    commissionEarned?: number
    completedAt?: Date
    createdAt: Date
    updatedAt: Date
}

const referralSchema = new mongoose.Schema({
    referrer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    referred: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    referralCode: {
        type: String,
        required: true,
        uppercase: true
    },
    status: {
        type: String,
        enum: ["pending", "completed", "expired", "cancelled"],
        default: "pending"
    },
    rewardType: {
        type: String,
        enum: ["points", "discount", "cashback"],
        default: "points"
    },
    referrerReward: {
        type: { type: String, default: "points" },
        value: { type: Number, default: 100 },
        claimed: { type: Boolean, default: false },
        claimedAt: Date,
        expiresAt: Date
    },
    referredReward: {
        type: { type: String, default: "discount" },
        value: { type: Number, default: 10 }, // 10% off first order
        claimed: { type: Boolean, default: false },
        claimedAt: Date,
        expiresAt: Date
    },
    qualifyingOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },
    orderAmount: Number,
    commissionEarned: {
        type: Number,
        default: 0
    },
    completedAt: Date
}, {
    timestamps: true
})

// Indexes
referralSchema.index({ referrer: 1, createdAt: -1 })
referralSchema.index({ referred: 1 }, { unique: true }) // User can only be referred once
referralSchema.index({ referralCode: 1 })
referralSchema.index({ status: 1 })

// Static methods
referralSchema.statics.getReferralStats = async function (userId: string) {
    const [stats] = await this.aggregate([
        { $match: { referrer: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalReferrals: { $sum: 1 },
                completedReferrals: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                },
                totalCommission: { $sum: "$commissionEarned" },
                totalRewardValue: { $sum: "$referrerReward.value" }
            }
        }
    ])

    return stats || {
        totalReferrals: 0,
        completedReferrals: 0,
        totalCommission: 0,
        totalRewardValue: 0
    }
}

referralSchema.statics.completeReferral = async function (
    referredUserId: string,
    orderId: string,
    orderAmount: number
) {
    const referral = await this.findOne({ referred: referredUserId, status: "pending" })
    if (!referral) return null

    // Calculate commission (e.g., 5% of order)
    const commission = Math.round(orderAmount * 0.05)

    referral.status = "completed"
    referral.qualifyingOrder = orderId
    referral.orderAmount = orderAmount
    referral.commissionEarned = commission
    referral.completedAt = new Date()

    await referral.save()

    // Add points to referrer (would typically trigger notification too)
    const User = mongoose.model("User")
    await User.findByIdAndUpdate(referral.referrer, {
        $inc: { loyaltyPoints: referral.referrerReward.value }
    })

    return referral
}

export const Referral = mongoose.models.Referral ||
    mongoose.model<IReferral>("Referral", referralSchema)
