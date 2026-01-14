/**
 * Session Model
 * For tracking user sessions across devices
 */

import mongoose, { Document, Model } from "mongoose"

export interface ISession extends Document {
    user: mongoose.Types.ObjectId
    token: string
    deviceInfo: {
        type: "desktop" | "mobile" | "tablet" | "unknown"
        os?: string
        browser?: string
        device?: string
    }
    ip: string
    location?: {
        country?: string
        city?: string
        region?: string
    }
    isActive: boolean
    lastActivity: Date
    expiresAt: Date
    createdAt: Date
}

const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true,
        select: false
    },
    deviceInfo: {
        type: {
            type: String,
            enum: ["desktop", "mobile", "tablet", "unknown"],
            default: "unknown"
        },
        os: String,
        browser: String,
        device: String
    },
    ip: {
        type: String,
        required: true
    },
    location: {
        country: String,
        city: String,
        region: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
})

// Indexes
sessionSchema.index({ user: 1, isActive: 1 })
sessionSchema.index({ token: 1 }, { unique: true })
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL
sessionSchema.index({ lastActivity: -1 })

// Static methods
sessionSchema.statics.createSession = async function (data: {
    userId: string
    token: string
    ip: string
    userAgent: string
    expiresIn?: number
}) {
    const deviceInfo = parseUserAgent(data.userAgent)
    const expiresAt = new Date(Date.now() + (data.expiresIn || 7 * 24 * 60 * 60 * 1000))

    return this.create({
        user: data.userId,
        token: data.token,
        ip: data.ip,
        deviceInfo,
        expiresAt
    })
}

sessionSchema.statics.getActiveSessions = function (userId: string) {
    return this.find({ user: userId, isActive: true })
        .select("-token")
        .sort({ lastActivity: -1 })
        .lean()
}

sessionSchema.statics.revokeSession = function (sessionId: string, userId: string) {
    return this.findOneAndUpdate(
        { _id: sessionId, user: userId },
        { isActive: false },
        { new: true }
    )
}

sessionSchema.statics.revokeAllSessions = function (userId: string, exceptSessionId?: string) {
    const query: any = { user: userId, isActive: true }
    if (exceptSessionId) {
        query._id = { $ne: exceptSessionId }
    }
    return this.updateMany(query, { isActive: false })
}

sessionSchema.statics.updateActivity = function (token: string) {
    return this.findOneAndUpdate(
        { token, isActive: true },
        { lastActivity: new Date() },
        { new: true }
    )
}

sessionSchema.statics.getSessionCount = function (userId: string) {
    return this.countDocuments({ user: userId, isActive: true })
}

// Helper to parse user agent
function parseUserAgent(ua: string): {
    type: "desktop" | "mobile" | "tablet" | "unknown"
    os?: string
    browser?: string
    device?: string
} {
    const result: any = { type: "unknown" }

    // Detect device type
    if (/mobile|android.*mobile|ip(hone|od)/i.test(ua)) {
        result.type = "mobile"
    } else if (/ipad|android(?!.*mobile)|tablet/i.test(ua)) {
        result.type = "tablet"
    } else if (/windows|mac|linux/i.test(ua)) {
        result.type = "desktop"
    }

    // Detect OS
    if (/windows/i.test(ua)) result.os = "Windows"
    else if (/mac/i.test(ua)) result.os = "macOS"
    else if (/linux/i.test(ua)) result.os = "Linux"
    else if (/android/i.test(ua)) result.os = "Android"
    else if (/iphone|ipad/i.test(ua)) result.os = "iOS"

    // Detect browser
    if (/chrome/i.test(ua) && !/edge|edg/i.test(ua)) result.browser = "Chrome"
    else if (/firefox/i.test(ua)) result.browser = "Firefox"
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) result.browser = "Safari"
    else if (/edge|edg/i.test(ua)) result.browser = "Edge"

    return result
}

export const Session = mongoose.models.Session ||
    mongoose.model<ISession>("Session", sessionSchema)
