/**
 * Wishlist Model (Standalone)
 * Alternative to embedded wishlist in User for better scalability
 */

import mongoose, { Document, Model } from "mongoose"

export interface IWishlistItem extends Document {
    user: mongoose.Types.ObjectId
    product: mongoose.Types.ObjectId
    variant?: {
        size?: string
        color?: string
    }
    priceAtAdd: number
    notifyOnPriceDrop: boolean
    notifyOnStock: boolean
    addedAt: Date
}

const wishlistItemSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    variant: {
        size: String,
        color: String
    },
    priceAtAdd: {
        type: Number,
        required: true
    },
    notifyOnPriceDrop: {
        type: Boolean,
        default: true
    },
    notifyOnStock: {
        type: Boolean,
        default: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false
})

// Compound unique index - user can only add a product once
wishlistItemSchema.index({ user: 1, product: 1 }, { unique: true })
wishlistItemSchema.index({ user: 1, addedAt: -1 })
wishlistItemSchema.index({ product: 1 }) // For price drop notifications

// Static methods
wishlistItemSchema.statics.addItem = async function (
    userId: string,
    productId: string,
    price: number,
    variant?: { size?: string; color?: string }
) {
    return this.findOneAndUpdate(
        { user: userId, product: productId },
        {
            user: userId,
            product: productId,
            priceAtAdd: price,
            variant,
            addedAt: new Date()
        },
        { upsert: true, new: true }
    )
}

wishlistItemSchema.statics.removeItem = function (userId: string, productId: string) {
    return this.deleteOne({ user: userId, product: productId })
}

wishlistItemSchema.statics.getUserWishlist = function (
    userId: string,
    options: { page?: number; limit?: number } = {}
) {
    const { page = 1, limit = 20 } = options
    return this.find({ user: userId })
        .sort({ addedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("product", "name slug price originalPrice images rating stock")
        .lean()
}

wishlistItemSchema.statics.isInWishlist = async function (
    userId: string,
    productId: string
): Promise<boolean> {
    const count = await this.countDocuments({ user: userId, product: productId })
    return count > 0
}

wishlistItemSchema.statics.getCount = function (userId: string) {
    return this.countDocuments({ user: userId })
}

// Get users who want price drop notifications for a product
wishlistItemSchema.statics.getUsersForPriceDropNotification = function (productId: string) {
    return this.find({ product: productId, notifyOnPriceDrop: true })
        .populate("user", "email name preferences")
        .lean()
}

// Get users who want stock notifications for a product
wishlistItemSchema.statics.getUsersForStockNotification = function (productId: string) {
    return this.find({ product: productId, notifyOnStock: true })
        .populate("user", "email name preferences")
        .lean()
}

export const WishlistItem = mongoose.models.WishlistItem ||
    mongoose.model<IWishlistItem>("WishlistItem", wishlistItemSchema)
