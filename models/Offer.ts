/**
 * Offer Model
 * For promotional offers, deals, and flash sales
 */

import mongoose, { Document, Model } from "mongoose"

export interface IOffer extends Document {
    title: string
    description: string
    image?: string
    discountText: string
    discountType: "percentage" | "fixed" | "freeShipping"
    discountValue: number
    link: string
    isFlashSale: boolean
    isActive: boolean
    priority: number
    applicableProducts?: mongoose.Types.ObjectId[]
    applicableCategories?: string[]
    minOrderValue?: number
    usageLimit?: number
    usedCount: number
    validFrom: Date
    validTo: Date
    createdAt: Date
    updatedAt: Date
}

interface IOfferModel extends Model<IOffer> {
    getActiveOffers(): Promise<IOffer[]>
    getFlashSales(): Promise<IOffer[]>
}

const offerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Offer title is required"],
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    image: {
        type: String
    },
    discountText: {
        type: String,
        required: true // e.g., "50% OFF", "FLAT ₹500 OFF"
    },
    discountType: {
        type: String,
        enum: ["percentage", "fixed", "freeShipping"],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    link: {
        type: String,
        required: true,
        default: "/products"
    },
    isFlashSale: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 0 // Higher priority = shown first
    },
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }],
    applicableCategories: [{
        type: String
    }],
    minOrderValue: {
        type: Number,
        min: 0
    },
    usageLimit: {
        type: Number,
        min: 0
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    validFrom: {
        type: Date,
        required: true,
        default: Date.now
    },
    validTo: {
        type: Date,
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// Indexes
offerSchema.index({ isActive: 1, validFrom: 1, validTo: 1 })
offerSchema.index({ isFlashSale: 1 })
offerSchema.index({ priority: -1 })

// Virtuals
offerSchema.virtual("isValid").get(function () {
    const now = new Date()
    return this.isActive && now >= this.validFrom && now <= this.validTo
})

offerSchema.virtual("isExpired").get(function () {
    return new Date() > this.validTo
})

offerSchema.virtual("remainingTime").get(function () {
    const now = new Date().getTime()
    const end = this.validTo.getTime()
    return Math.max(0, end - now)
})

// Static methods
offerSchema.statics.getActiveOffers = function () {
    const now = new Date()
    return this.find({
        isActive: true,
        validFrom: { $lte: now },
        validTo: { $gte: now }
    }).sort({ priority: -1, createdAt: -1 })
}

offerSchema.statics.getFlashSales = function () {
    const now = new Date()
    return this.find({
        isActive: true,
        isFlashSale: true,
        validFrom: { $lte: now },
        validTo: { $gte: now }
    }).sort({ validTo: 1 }) // Show ending soon first
}

export const Offer = mongoose.models.Offer ||
    mongoose.model<IOffer, IOfferModel>("Offer", offerSchema)
