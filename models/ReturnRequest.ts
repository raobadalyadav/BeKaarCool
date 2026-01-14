/**
 * Return Request Model
 * For handling product returns and refunds
 */

import mongoose, { Document, Model } from "mongoose"

export interface IReturnRequest extends Document {
    returnNumber: string
    order: mongoose.Types.ObjectId
    user: mongoose.Types.ObjectId
    items: Array<{
        product: mongoose.Types.ObjectId
        quantity: number
        reason: string
        condition: "unopened" | "opened" | "damaged" | "defective"
        images?: string[]
    }>
    type: "return" | "exchange" | "refund"
    status: "requested" | "approved" | "pickup_scheduled" | "picked_up" | "received" | "inspecting" | "completed" | "rejected"
    reason: string
    comments?: string
    pickupAddress: {
        name: string
        phone: string
        address: string
        city: string
        state: string
        pincode: string
    }
    pickupDetails?: {
        scheduledDate?: Date
        scheduledSlot?: string
        awbNumber?: string
        pickedUpAt?: Date
    }
    inspection?: {
        inspectedBy?: mongoose.Types.ObjectId
        inspectedAt?: Date
        condition: string
        notes?: string
        approved: boolean
    }
    refundDetails?: {
        amount: number
        method: "original" | "wallet" | "bank"
        transactionId?: string
        processedAt?: Date
    }
    exchangeDetails?: {
        newProduct?: mongoose.Types.ObjectId
        newVariant?: string
        shipmentId?: string
    }
    timeline: Array<{
        status: string
        timestamp: Date
        note?: string
        by?: mongoose.Types.ObjectId
    }>
    createdAt: Date
    updatedAt: Date
}

const returnRequestSchema = new mongoose.Schema({
    returnNumber: {
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
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        reason: {
            type: String,
            required: true
        },
        condition: {
            type: String,
            enum: ["unopened", "opened", "damaged", "defective"],
            required: true
        },
        images: [String]
    }],
    type: {
        type: String,
        enum: ["return", "exchange", "refund"],
        default: "return"
    },
    status: {
        type: String,
        enum: ["requested", "approved", "pickup_scheduled", "picked_up", "received", "inspecting", "completed", "rejected"],
        default: "requested"
    },
    reason: {
        type: String,
        required: true,
        maxlength: 500
    },
    comments: {
        type: String,
        maxlength: 1000
    },
    pickupAddress: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true }
    },
    pickupDetails: {
        scheduledDate: Date,
        scheduledSlot: String,
        awbNumber: String,
        pickedUpAt: Date
    },
    inspection: {
        inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        inspectedAt: Date,
        condition: String,
        notes: String,
        approved: Boolean
    },
    refundDetails: {
        amount: Number,
        method: {
            type: String,
            enum: ["original", "wallet", "bank"]
        },
        transactionId: String,
        processedAt: Date
    },
    exchangeDetails: {
        newProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        newVariant: String,
        shipmentId: String
    },
    timeline: [{
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    }]
}, {
    timestamps: true
})

// Indexes
returnRequestSchema.index({ returnNumber: 1 }, { unique: true })
returnRequestSchema.index({ order: 1 })
returnRequestSchema.index({ user: 1, createdAt: -1 })
returnRequestSchema.index({ status: 1 })

// Pre-save hook to generate return number
returnRequestSchema.pre("save", async function (next) {
    if (this.isNew && !this.returnNumber) {
        const date = new Date()
        const prefix = `RET${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`
        const count = await mongoose.model("ReturnRequest").countDocuments({
            createdAt: {
                $gte: new Date(date.getFullYear(), date.getMonth(), 1)
            }
        })
        this.returnNumber = `${prefix}${String(count + 1).padStart(5, "0")}`

        // Add initial timeline event
        this.timeline.push({
            status: "requested",
            timestamp: new Date(),
            note: "Return request created"
        })
    }
    next()
})

// Instance methods
returnRequestSchema.methods.updateStatus = function (
    status: string,
    note?: string,
    byUserId?: string
) {
    this.status = status
    this.timeline.push({
        status,
        timestamp: new Date(),
        note,
        by: byUserId
    })
    return this.save()
}

// Static methods
returnRequestSchema.statics.getByUser = function (userId: string, options = { page: 1, limit: 10 }) {
    return this.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .populate("order", "orderNumber")
        .populate("items.product", "name images")
        .lean()
}

returnRequestSchema.statics.getPendingReturns = function () {
    return this.find({
        status: { $in: ["requested", "approved", "pickup_scheduled", "picked_up", "received", "inspecting"] }
    })
        .sort({ createdAt: 1 })
        .populate("user", "name email")
        .populate("order", "orderNumber")
        .lean()
}

export const ReturnRequest = mongoose.models.ReturnRequest ||
    mongoose.model<IReturnRequest>("ReturnRequest", returnRequestSchema)
