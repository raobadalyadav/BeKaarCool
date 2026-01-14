/**
 * RewardTransaction Model
 * For tracking loyalty points earned and redeemed
 */

import mongoose, { Document, Model } from "mongoose"

export interface IRewardTransaction extends Document {
    user: mongoose.Types.ObjectId
    type: "earned" | "redeemed" | "expired" | "bonus" | "refund"
    points: number
    balance: number // Running balance after transaction
    description: string
    source: "purchase" | "referral" | "review" | "birthday" | "signup" | "redemption" | "admin" | "refund"
    sourceRef?: mongoose.Types.ObjectId
    sourceRefModel?: string
    orderId?: mongoose.Types.ObjectId
    expiresAt?: Date
    createdAt: Date
    updatedAt: Date
}

interface IRewardTransactionModel extends Model<IRewardTransaction> {
    getUserTransactions(userId: string, page?: number, limit?: number): Promise<{ transactions: IRewardTransaction[]; total: number }>
    getUserBalance(userId: string): Promise<number>
    addPoints(userId: string, points: number, source: string, description: string, sourceRef?: string): Promise<IRewardTransaction>
    redeemPoints(userId: string, points: number, orderId?: string): Promise<{ success: boolean; transaction?: IRewardTransaction; error?: string }>
}

const rewardTransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["earned", "redeemed", "expired", "bonus", "refund"],
        required: true
    },
    points: {
        type: Number,
        required: true
    },
    balance: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    source: {
        type: String,
        enum: ["purchase", "referral", "review", "birthday", "signup", "redemption", "admin", "refund"],
        required: true
    },
    sourceRef: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "sourceRefModel"
    },
    sourceRefModel: {
        type: String,
        enum: ["Order", "Review", "Referral", "User"]
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },
    expiresAt: {
        type: Date
    }
}, {
    timestamps: true
})

// Indexes
rewardTransactionSchema.index({ user: 1, createdAt: -1 })
rewardTransactionSchema.index({ type: 1 })
rewardTransactionSchema.index({ source: 1 })
rewardTransactionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Static methods
rewardTransactionSchema.statics.getUserTransactions = async function (
    userId: string,
    page = 1,
    limit = 20
) {
    const skip = (page - 1) * limit

    const [transactions, total] = await Promise.all([
        this.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        this.countDocuments({ user: userId })
    ])

    return { transactions, total }
}

rewardTransactionSchema.statics.getUserBalance = async function (userId: string) {
    const User = mongoose.model("User")
    const user = await User.findById(userId).select("loyaltyPoints")
    return user?.loyaltyPoints || 0
}

rewardTransactionSchema.statics.addPoints = async function (
    userId: string,
    points: number,
    source: string,
    description: string,
    sourceRef?: string
) {
    const User = mongoose.model("User")

    // Update user's loyalty points
    const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { loyaltyPoints: points } },
        { new: true }
    )

    if (!user) throw new Error("User not found")

    // Create transaction record
    const transaction = await this.create({
        user: userId,
        type: points > 0 ? "earned" : "redeemed",
        points: Math.abs(points),
        balance: user.loyaltyPoints,
        description,
        source,
        sourceRef: sourceRef ? new mongoose.Types.ObjectId(sourceRef) : undefined,
        expiresAt: points > 0 ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : undefined // 1 year expiry
    })

    return transaction
}

rewardTransactionSchema.statics.redeemPoints = async function (
    userId: string,
    points: number,
    orderId?: string
) {
    const User = mongoose.model("User")

    const user = await User.findById(userId)
    if (!user) {
        return { success: false, error: "User not found" }
    }

    if (user.loyaltyPoints < points) {
        return { success: false, error: "Insufficient points" }
    }

    // Deduct points
    user.loyaltyPoints -= points
    await user.save()

    // Create redemption transaction
    const transaction = await this.create({
        user: userId,
        type: "redeemed",
        points,
        balance: user.loyaltyPoints,
        description: orderId ? `Redeemed for order` : "Points redeemed",
        source: "redemption",
        orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined
    })

    return { success: true, transaction }
}

export const RewardTransaction = mongoose.models.RewardTransaction ||
    mongoose.model<IRewardTransaction, IRewardTransactionModel>("RewardTransaction", rewardTransactionSchema)
