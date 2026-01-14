/**
 * Transaction Model
 * For tracking all payment transactions
 */

import mongoose, { Document, Model } from "mongoose"

export interface ITransaction extends Document {
    transactionId: string
    order: mongoose.Types.ObjectId
    user: mongoose.Types.ObjectId
    type: "payment" | "refund" | "partial_refund" | "chargeback"
    provider: "razorpay" | "phonepe" | "paytm" | "payu" | "stripe" | "cod"
    amount: number
    currency: string
    status: "pending" | "processing" | "completed" | "failed" | "cancelled" | "refunded"
    providerTransactionId?: string
    providerOrderId?: string
    paymentMethod?: {
        type: "card" | "upi" | "netbanking" | "wallet" | "cod" | "emi"
        last4?: string
        brand?: string
        bank?: string
        wallet?: string
        vpa?: string
    }
    metadata?: Record<string, any>
    failureReason?: string
    refundReason?: string
    refundedAt?: Date
    completedAt?: Date
    ipAddress?: string
    userAgent?: string
    createdAt: Date
    updatedAt: Date
}

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["payment", "refund", "partial_refund", "chargeback"],
        default: "payment"
    },
    provider: {
        type: String,
        enum: ["razorpay", "phonepe", "paytm", "payu", "stripe", "cod"],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: "INR",
        uppercase: true
    },
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed", "cancelled", "refunded"],
        default: "pending"
    },
    providerTransactionId: String,
    providerOrderId: String,
    paymentMethod: {
        type: {
            type: String,
            enum: ["card", "upi", "netbanking", "wallet", "cod", "emi"]
        },
        last4: String,
        brand: String,
        bank: String,
        wallet: String,
        vpa: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    failureReason: String,
    refundReason: String,
    refundedAt: Date,
    completedAt: Date,
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
})

// Indexes
transactionSchema.index({ transactionId: 1 }, { unique: true })
transactionSchema.index({ order: 1 })
transactionSchema.index({ user: 1, createdAt: -1 })
transactionSchema.index({ provider: 1 })
transactionSchema.index({ status: 1 })
transactionSchema.index({ createdAt: -1 })
transactionSchema.index({ providerTransactionId: 1 })

// Pre-save hook to generate transaction ID
transactionSchema.pre("save", function (next) {
    if (this.isNew && !this.transactionId) {
        const prefix = this.type === "refund" ? "REF" : "TXN"
        const timestamp = Date.now().toString(36).toUpperCase()
        const random = Math.random().toString(36).substring(2, 8).toUpperCase()
        this.transactionId = `${prefix}${timestamp}${random}`
    }
    next()
})

// Static methods
transactionSchema.statics.getRevenueByPeriod = async function (
    startDate: Date,
    endDate: Date,
    groupBy: "day" | "week" | "month" = "day"
) {
    const dateFormat = {
        day: "%Y-%m-%d",
        week: "%Y-W%V",
        month: "%Y-%m"
    }

    return this.aggregate([
        {
            $match: {
                status: "completed",
                type: "payment",
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: dateFormat[groupBy], date: "$createdAt" } },
                revenue: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ])
}

transactionSchema.statics.getProviderBreakdown = async function (startDate?: Date, endDate?: Date) {
    const match: any = { status: "completed", type: "payment" }
    if (startDate) match.createdAt = { $gte: startDate }
    if (endDate) match.createdAt = { ...match.createdAt, $lte: endDate }

    return this.aggregate([
        { $match: match },
        {
            $group: {
                _id: "$provider",
                total: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { total: -1 } }
    ])
}

export const Transaction = mongoose.models.Transaction ||
    mongoose.model<ITransaction>("Transaction", transactionSchema)
