/**
 * Activity Log Model
 * For auditing user and admin actions
 */

import mongoose, { Document, Model } from "mongoose"

export interface IActivityLog extends Document {
    user?: mongoose.Types.ObjectId
    type: "auth" | "order" | "product" | "user" | "admin" | "system" | "payment" | "shipping"
    action: string
    description?: string
    entity?: {
        type: string
        id: mongoose.Types.ObjectId
    }
    metadata?: Record<string, any>
    changes?: {
        before?: Record<string, any>
        after?: Record<string, any>
    }
    ip?: string
    userAgent?: string
    location?: {
        country?: string
        city?: string
    }
    status: "success" | "failure" | "pending"
    errorMessage?: string
    duration?: number
    createdAt: Date
}

const activityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    type: {
        type: String,
        enum: ["auth", "order", "product", "user", "admin", "system", "payment", "shipping"],
        required: true
    },
    action: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500
    },
    entity: {
        type: String,
        id: mongoose.Schema.Types.ObjectId
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    changes: {
        before: mongoose.Schema.Types.Mixed,
        after: mongoose.Schema.Types.Mixed
    },
    ip: String,
    userAgent: String,
    location: {
        country: String,
        city: String
    },
    status: {
        type: String,
        enum: ["success", "failure", "pending"],
        default: "success"
    },
    errorMessage: String,
    duration: Number // in milliseconds
}, {
    timestamps: true,
    // Don't update, only create
    capped: { size: 1073741824, max: 1000000 } // 1GB cap, 1M docs max
})

// Indexes for efficient querying
activityLogSchema.index({ user: 1, createdAt: -1 })
activityLogSchema.index({ type: 1, createdAt: -1 })
activityLogSchema.index({ action: 1 })
activityLogSchema.index({ "entity.type": 1, "entity.id": 1 })
activityLogSchema.index({ createdAt: -1 })
activityLogSchema.index({ status: 1 })

// TTL index - auto-delete after 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

// Static helper to create log
activityLogSchema.statics.log = function (data: {
    user?: string
    type: string
    action: string
    description?: string
    entity?: { type: string; id: string }
    metadata?: Record<string, any>
    changes?: { before?: any; after?: any }
    ip?: string
    userAgent?: string
    status?: "success" | "failure" | "pending"
    errorMessage?: string
    duration?: number
}) {
    return this.create({
        ...data,
        user: data.user ? new mongoose.Types.ObjectId(data.user) : undefined,
        entity: data.entity ? {
            type: data.entity.type,
            id: new mongoose.Types.ObjectId(data.entity.id)
        } : undefined
    })
}

// Common log functions
activityLogSchema.statics.logAuth = function (
    userId: string | undefined,
    action: string,
    success: boolean,
    metadata?: Record<string, unknown>
) {
    return this.create({
        user: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        type: "auth",
        action,
        status: success ? "success" : "failure",
        metadata
    })
}

activityLogSchema.statics.logOrder = function (
    userId: string,
    orderId: string,
    action: string,
    metadata?: Record<string, unknown>
) {
    return this.create({
        user: new mongoose.Types.ObjectId(userId),
        type: "order",
        action,
        entity: { type: "Order", id: new mongoose.Types.ObjectId(orderId) },
        metadata
    })
}

activityLogSchema.statics.logAdmin = function (
    adminId: string,
    action: string,
    entity: { type: string; id: string },
    changes?: { before?: unknown; after?: unknown }
) {
    return this.create({
        user: new mongoose.Types.ObjectId(adminId),
        type: "admin",
        action,
        entity: { type: entity.type, id: new mongoose.Types.ObjectId(entity.id) },
        changes
    })
}

// Query helpers
activityLogSchema.statics.getRecentByUser = function (
    userId: string,
    limit: number = 50
) {
    return this.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
}

activityLogSchema.statics.getByEntity = function (
    entityType: string,
    entityId: string,
    limit: number = 50
) {
    return this.find({ "entity.type": entityType, "entity.id": entityId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("user", "name email")
        .lean()
}

export const ActivityLog = mongoose.models.ActivityLog ||
    mongoose.model<IActivityLog>("ActivityLog", activityLogSchema)
