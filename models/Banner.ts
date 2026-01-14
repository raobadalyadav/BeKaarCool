/**
 * Banner Model
 * For homepage carousels, promotional banners, and CMS content
 */

import mongoose, { Document, Model } from "mongoose"

export interface IBanner extends Document {
    title: string
    subtitle?: string
    description?: string
    image: string
    mobileImage?: string
    link?: string
    linkText?: string
    position: number
    type: "hero" | "promo" | "category" | "sale" | "announcement"
    placement: "homepage" | "category" | "product" | "cart" | "checkout"
    backgroundColor?: string
    textColor?: string
    isActive: boolean
    startDate?: Date
    endDate?: Date
    targetAudience?: "all" | "new" | "returning" | "members"
    clickCount: number
    impressionCount: number
    createdBy?: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Banner title is required"],
        trim: true,
        maxlength: [100, "Title cannot exceed 100 characters"]
    },
    subtitle: {
        type: String,
        trim: true,
        maxlength: [200, "Subtitle cannot exceed 200 characters"]
    },
    description: {
        type: String,
        maxlength: [500, "Description cannot exceed 500 characters"]
    },
    image: {
        type: String,
        required: [true, "Banner image is required"]
    },
    mobileImage: {
        type: String // Optimized image for mobile
    },
    link: {
        type: String,
        trim: true
    },
    linkText: {
        type: String,
        default: "Shop Now"
    },
    position: {
        type: Number,
        default: 0,
        min: 0
    },
    type: {
        type: String,
        enum: ["hero", "promo", "category", "sale", "announcement"],
        default: "hero"
    },
    placement: {
        type: String,
        enum: ["homepage", "category", "product", "cart", "checkout"],
        default: "homepage"
    },
    backgroundColor: {
        type: String,
        default: "#000000"
    },
    textColor: {
        type: String,
        default: "#FFFFFF"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    targetAudience: {
        type: String,
        enum: ["all", "new", "returning", "members"],
        default: "all"
    },
    clickCount: {
        type: Number,
        default: 0
    },
    impressionCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
})

// Indexes
bannerSchema.index({ isActive: 1, placement: 1 })
bannerSchema.index({ type: 1 })
bannerSchema.index({ position: 1 })
bannerSchema.index({ startDate: 1, endDate: 1 })

// Virtual for checking if banner is currently valid
bannerSchema.virtual("isCurrentlyActive").get(function () {
    const now = new Date()
    if (!this.isActive) return false
    if (this.startDate && this.startDate > now) return false
    if (this.endDate && this.endDate < now) return false
    return true
})

// Static method to get active banners for placement
bannerSchema.statics.getActiveByPlacement = function (placement: string) {
    const now = new Date()
    return this.find({
        isActive: true,
        placement,
        $and: [
            {
                $or: [
                    { startDate: { $exists: false } },
                    { startDate: null },
                    { startDate: { $lte: now } }
                ]
            },
            {
                $or: [
                    { endDate: { $exists: false } },
                    { endDate: null },
                    { endDate: { $gte: now } }
                ]
            }
        ]
    }).sort({ position: 1 })
}

export const Banner = mongoose.models.Banner || mongoose.model<IBanner>("Banner", bannerSchema)
