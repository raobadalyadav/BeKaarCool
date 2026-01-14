/**
 * WalletTransaction Model
 * For tracking wallet credits, debits, and gift card redemptions
 */

import mongoose, { Document, Model } from "mongoose"

export interface IWalletTransaction extends Document {
    user: mongoose.Types.ObjectId
    type: "credit" | "debit" | "refund" | "giftcard" | "cashback"
    amount: number
    balance: number // Running balance after transaction
    description: string
    source: "order_refund" | "giftcard" | "cashback" | "admin" | "referral" | "promo"
    sourceRef?: mongoose.Types.ObjectId
    sourceRefModel?: string
    orderId?: mongoose.Types.ObjectId
    giftCardCode?: string
    status: "pending" | "completed" | "failed"
    expiresAt?: Date
    createdAt: Date
    updatedAt: Date
}

interface IWalletTransactionModel extends Model<IWalletTransaction> {
    getUserBalance(userId: string): Promise<number>
    getUserTransactions(userId: string, page?: number, limit?: number): Promise<{
        transactions: IWalletTransaction[]
        total: number
    }>
    addBalance(userId: string, amount: number, source: string, description: string): Promise<IWalletTransaction>
    deductBalance(userId: string, amount: number, description: string, orderId?: string): Promise<{
        success: boolean
        transaction?: IWalletTransaction
        error?: string
    }>
    redeemGiftCard(userId: string, code: string): Promise<{
        success: boolean
        amount?: number
        error?: string
    }>
}

const walletTransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["credit", "debit", "refund", "giftcard", "cashback"],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
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
        enum: ["order_refund", "giftcard", "cashback", "admin", "referral", "promo"],
        required: true
    },
    sourceRef: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "sourceRefModel"
    },
    sourceRefModel: {
        type: String,
        enum: ["Order", "GiftCard", "Referral"]
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },
    giftCardCode: String,
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "completed"
    },
    expiresAt: Date
}, {
    timestamps: true
})

// Indexes
walletTransactionSchema.index({ user: 1, createdAt: -1 })
walletTransactionSchema.index({ type: 1 })
walletTransactionSchema.index({ status: 1 })

// Get user's wallet balance
walletTransactionSchema.statics.getUserBalance = async function (userId: string) {
    const User = mongoose.model("User")
    const user = await User.findById(userId).select("walletBalance")
    return user?.walletBalance || 0
}

// Get user transactions
walletTransactionSchema.statics.getUserTransactions = async function (
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

// Add balance to wallet
walletTransactionSchema.statics.addBalance = async function (
    userId: string,
    amount: number,
    source: string,
    description: string
) {
    const User = mongoose.model("User")

    // Update user's wallet balance
    const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { walletBalance: amount } },
        { new: true }
    )

    if (!user) throw new Error("User not found")

    // Create transaction record
    return this.create({
        user: userId,
        type: "credit",
        amount,
        balance: user.walletBalance,
        description,
        source,
        status: "completed"
    })
}

// Deduct balance from wallet
walletTransactionSchema.statics.deductBalance = async function (
    userId: string,
    amount: number,
    description: string,
    orderId?: string
) {
    const User = mongoose.model("User")

    const user = await User.findById(userId)
    if (!user) return { success: false, error: "User not found" }

    if ((user.walletBalance || 0) < amount) {
        return { success: false, error: "Insufficient wallet balance" }
    }

    user.walletBalance -= amount
    await user.save()

    const transaction = await this.create({
        user: userId,
        type: "debit",
        amount,
        balance: user.walletBalance,
        description,
        source: "order_refund",
        orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
        status: "completed"
    })

    return { success: true, transaction }
}

// Redeem gift card
walletTransactionSchema.statics.redeemGiftCard = async function (
    userId: string,
    code: string
) {
    // In production, this would validate against a GiftCard collection
    // For now, we'll use a simple validation

    // Check if code format is valid (e.g., 16 alphanumeric characters)
    if (!/^[A-Z0-9]{16}$/.test(code.toUpperCase())) {
        return { success: false, error: "Invalid gift card code format" }
    }

    // Check if already used
    const existing = await this.findOne({ giftCardCode: code.toUpperCase() })
    if (existing) {
        return { success: false, error: "Gift card already redeemed" }
    }

    // For demo: assume all valid codes are worth ₹500
    const amount = 500

    const User = mongoose.model("User")
    const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { walletBalance: amount } },
        { new: true }
    )

    if (!user) return { success: false, error: "User not found" }

    await this.create({
        user: userId,
        type: "giftcard",
        amount,
        balance: user.walletBalance,
        description: `Gift card redeemed: ${code}`,
        source: "giftcard",
        giftCardCode: code.toUpperCase(),
        status: "completed"
    })

    return { success: true, amount }
}

export const WalletTransaction = (mongoose.models.WalletTransaction as IWalletTransactionModel) ||
    mongoose.model<IWalletTransaction, IWalletTransactionModel>("WalletTransaction", walletTransactionSchema)
