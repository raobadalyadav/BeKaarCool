/**
 * Notification Model
 * For user notifications across all channels
 */

import mongoose, { Document, Model } from "mongoose"

export interface INotification extends Document {
    user: mongoose.Types.ObjectId
    type: "order" | "promo" | "system" | "review" | "wishlist" | "price_drop" | "stock" | "delivery"
    title: string
    message: string
    data?: Record<string, any>
    image?: string
    link?: string
    channels: Array<"in_app" | "email" | "sms" | "push">
    isRead: boolean
    readAt?: Date
    isSent: {
        email: boolean
        sms: boolean
        push: boolean
    }
    sentAt?: Date
    expiresAt?: Date
    priority: "low" | "medium" | "high"
    createdAt: Date
}

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ["order", "promo", "system", "review", "wishlist", "price_drop", "stock", "delivery"],
        required: true
    },
    title: {
        type: String,
        required: [true, "Notification title is required"],
        maxlength: [100, "Title cannot exceed 100 characters"]
    },
    message: {
        type: String,
        required: [true, "Notification message is required"],
        maxlength: [500, "Message cannot exceed 500 characters"]
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    image: String,
    link: String,
    channels: [{
        type: String,
        enum: ["in_app", "email", "sms", "push"]
    }],
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    isSent: {
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: false }
    },
    sentAt: Date,
    expiresAt: Date,
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    }
}, {
    timestamps: true
})

// Indexes
notificationSchema.index({ user: 1, createdAt: -1 })
notificationSchema.index({ user: 1, isRead: 1 })
notificationSchema.index({ type: 1 })
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index

// Static methods
notificationSchema.statics.getUnreadCount = function (userId: string) {
    return this.countDocuments({ user: userId, isRead: false })
}

notificationSchema.statics.markAllAsRead = function (userId: string) {
    return this.updateMany(
        { user: userId, isRead: false },
        { isRead: true, readAt: new Date() }
    )
}

notificationSchema.statics.getUserNotifications = function (
    userId: string,
    options: { page?: number; limit?: number; type?: string } = {}
) {
    const { page = 1, limit = 20, type } = options
    const query: any = { user: userId }
    if (type) query.type = type

    return this.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
}

// Instance method to mark as read
notificationSchema.methods.markAsRead = function () {
    this.isRead = true
    this.readAt = new Date()
    return this.save()
}

export const Notification = mongoose.models.Notification ||
    mongoose.model<INotification>("Notification", notificationSchema)
