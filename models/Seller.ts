/**
 * Seller Model
 * For managing seller profiles and business information
 * Links to User model via userId field
 */

import mongoose, { Document, Model } from "mongoose"

export type SellerStatus = "pending" | "approved" | "rejected" | "suspended" | "deleted"
export type BusinessType = "individual" | "proprietorship" | "partnership" | "pvt_ltd" | "llp" | "other"
export type PaymentSchedule = "weekly" | "biweekly" | "monthly"

export interface IStatusHistory {
    status: SellerStatus
    timestamp: Date
    reason?: string
    by?: mongoose.Types.ObjectId
}

export interface IBankDetails {
    accountHolderName: string
    accountNumber: string
    ifscCode: string
    bankName: string
    branchName?: string
    upiId?: string
    isVerified: boolean
}

export interface IBusinessAddress {
    address: string
    landmark?: string
    city: string
    state: string
    pincode: string
    country: string
}

export interface IDocument {
    type: "gst" | "pan" | "aadhaar" | "business_license" | "bank_statement" | "cancelled_cheque" | "other"
    number?: string
    url?: string
    isVerified: boolean
    verifiedAt?: Date
    verifiedBy?: mongoose.Types.ObjectId
}

export interface ISeller extends Document {
    user: mongoose.Types.ObjectId

    // Business Information
    businessName: string
    businessType: BusinessType
    businessDescription?: string
    businessLogo?: string
    businessBanner?: string
    businessEmail?: string
    businessPhone?: string
    businessWebsite?: string
    businessAddress: IBusinessAddress

    // Documents & Verification
    gstNumber?: string
    panNumber?: string
    documents: IDocument[]

    // Bank Details
    bankDetails?: IBankDetails

    // Status & Verification
    status: SellerStatus
    statusHistory: IStatusHistory[]
    isVerified: boolean
    verificationNote?: string

    // Commission & Payments
    commissionRate: number // Platform commission percentage (e.g., 10 = 10%)
    paymentSchedule: PaymentSchedule
    minimumPayout: number
    pendingPayout: number
    totalEarnings: number
    totalPayouts: number
    lastPayoutDate?: Date

    // Performance Metrics
    rating: number
    totalRatings: number
    totalProducts: number
    totalOrders: number
    ordersDelivered: number
    ordersCancelled: number
    returnsProcessed: number
    averageDeliveryDays: number

    // Settings
    autoAcceptOrders: boolean
    vacationMode: boolean
    vacationModeUntil?: Date

    // Timestamps
    approvedAt?: Date
    approvedBy?: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

// Business Address Schema
const businessAddressSchema = new mongoose.Schema({
    address: { type: String, required: true },
    landmark: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" }
}, { _id: false })

// Document Schema
const documentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["gst", "pan", "aadhaar", "business_license", "bank_statement", "cancelled_cheque", "other"],
        required: true
    },
    number: String,
    url: String,
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { _id: true })

// Bank Details Schema
const bankDetailsSchema = new mongoose.Schema({
    accountHolderName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    bankName: { type: String, required: true },
    branchName: String,
    upiId: String,
    isVerified: { type: Boolean, default: false }
}, { _id: false })

// Status History Schema
const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "suspended", "deleted"],
        required: true
    },
    timestamp: { type: Date, default: Date.now },
    reason: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { _id: false })

// Main Seller Schema
const sellerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    // Business Information
    businessName: {
        type: String,
        required: [true, "Business name is required"],
        trim: true,
        minlength: [2, "Business name must be at least 2 characters"],
        maxlength: [200, "Business name cannot exceed 200 characters"]
    },
    businessType: {
        type: String,
        enum: ["individual", "proprietorship", "partnership", "pvt_ltd", "llp", "other"],
        default: "individual"
    },
    businessDescription: {
        type: String,
        maxlength: [2000, "Description cannot exceed 2000 characters"]
    },
    businessLogo: String,
    businessBanner: String,
    businessEmail: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
    },
    businessPhone: {
        type: String,
        match: [/^[6-9]\d{9}$/, "Please provide a valid phone number"]
    },
    businessWebsite: String,
    businessAddress: {
        type: businessAddressSchema,
        required: true
    },

    // Documents & Verification
    gstNumber: {
        type: String,
        uppercase: true,
        match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST number"]
    },
    panNumber: {
        type: String,
        uppercase: true,
        match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number"]
    },
    documents: [documentSchema],

    // Bank Details
    bankDetails: bankDetailsSchema,

    // Status & Verification
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "suspended", "deleted"],
        default: "pending"
    },
    statusHistory: [statusHistorySchema],
    isVerified: { type: Boolean, default: false },
    verificationNote: String,

    // Commission & Payments
    commissionRate: { type: Number, default: 10, min: 0, max: 50 },
    paymentSchedule: {
        type: String,
        enum: ["weekly", "biweekly", "monthly"],
        default: "monthly"
    },
    minimumPayout: { type: Number, default: 500, min: 0 },
    pendingPayout: { type: Number, default: 0, min: 0 },
    totalEarnings: { type: Number, default: 0, min: 0 },
    totalPayouts: { type: Number, default: 0, min: 0 },
    lastPayoutDate: Date,

    // Performance Metrics
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0, min: 0 },
    totalProducts: { type: Number, default: 0, min: 0 },
    totalOrders: { type: Number, default: 0, min: 0 },
    ordersDelivered: { type: Number, default: 0, min: 0 },
    ordersCancelled: { type: Number, default: 0, min: 0 },
    returnsProcessed: { type: Number, default: 0, min: 0 },
    averageDeliveryDays: { type: Number, default: 0, min: 0 },

    // Settings
    autoAcceptOrders: { type: Boolean, default: true },
    vacationMode: { type: Boolean, default: false },
    vacationModeUntil: Date,

    // Approval Info
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, {
    timestamps: true,
    toJSON: { virtuals: true }
})

// Indexes
sellerSchema.index({ user: 1 }, { unique: true })
sellerSchema.index({ status: 1 })
sellerSchema.index({ businessName: "text" })
sellerSchema.index({ businessType: 1 })
sellerSchema.index({ isVerified: 1 })
sellerSchema.index({ createdAt: -1 })
sellerSchema.index({ rating: -1 })
sellerSchema.index({ gstNumber: 1 }, { sparse: true })
sellerSchema.index({ panNumber: 1 }, { sparse: true })

// Virtuals
sellerSchema.virtual("fulfillmentRate").get(function () {
    if (this.totalOrders === 0) return 100
    return Math.round((this.ordersDelivered / this.totalOrders) * 100)
})

sellerSchema.virtual("returnRate").get(function () {
    if (this.ordersDelivered === 0) return 0
    return Math.round((this.returnsProcessed / this.ordersDelivered) * 100)
})

sellerSchema.virtual("cancellationRate").get(function () {
    if (this.totalOrders === 0) return 0
    return Math.round((this.ordersCancelled / this.totalOrders) * 100)
})

// Pre-save hooks
sellerSchema.pre("save", function () {
    // Add to status history if status changed
    if (this.isModified("status")) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date()
        })

        if (this.status === "approved" && !this.approvedAt) {
            this.approvedAt = new Date()
        }
    }
})

// Instance methods
sellerSchema.methods.updateStatus = async function (
    status: SellerStatus,
    reason?: string,
    byUserId?: string
) {
    this.status = status
    this.statusHistory.push({
        status,
        timestamp: new Date(),
        reason,
        by: byUserId
    })

    if (status === "approved" && !this.approvedAt) {
        this.approvedAt = new Date()
        this.approvedBy = byUserId
    }

    return this.save()
}

sellerSchema.methods.addEarnings = async function (amount: number) {
    this.totalEarnings += amount
    this.pendingPayout += amount
    return this.save()
}

sellerSchema.methods.processPayout = async function (amount: number) {
    if (amount > this.pendingPayout) {
        throw new Error("Payout amount exceeds pending balance")
    }
    this.pendingPayout -= amount
    this.totalPayouts += amount
    this.lastPayoutDate = new Date()
    return this.save()
}

// Static methods
sellerSchema.statics.getStats = async function () {
    return this.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
                suspended: { $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] } },
                rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
                totalEarnings: { $sum: "$totalEarnings" },
                totalPendingPayouts: { $sum: "$pendingPayout" },
                avgRating: { $avg: "$rating" }
            }
        }
    ])
}

sellerSchema.statics.findByUserId = function (userId: string) {
    return this.findOne({ user: userId })
}

export const Seller = mongoose.models.Seller || mongoose.model<ISeller>("Seller", sellerSchema)
