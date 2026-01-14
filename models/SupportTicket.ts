/**
 * SupportTicket Model
 * For managing customer support tickets
 */

import mongoose, { Document, Model } from "mongoose"

export interface ISupportTicket extends Document {
    user: mongoose.Types.ObjectId
    ticketNumber: string
    subject: string
    category: "order" | "payment" | "product" | "shipping" | "return" | "account" | "other"
    priority: "low" | "medium" | "high" | "urgent"
    status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed"
    messages: Array<{
        sender: "customer" | "support"
        message: string
        attachments?: string[]
        createdAt: Date
    }>
    orderId?: mongoose.Types.ObjectId
    assignedTo?: mongoose.Types.ObjectId
    resolvedAt?: Date
    createdAt: Date
    updatedAt: Date
}

interface ISupportTicketModel extends Model<ISupportTicket> {
    generateTicketNumber(): Promise<string>
    getUserTickets(userId: string, page?: number, limit?: number): Promise<{
        tickets: ISupportTicket[]
        total: number
    }>
}

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        enum: ["customer", "support"],
        required: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 2000
    },
    attachments: [String],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true })

const supportTicketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    ticketNumber: {
        type: String,
        unique: true
    },
    subject: {
        type: String,
        required: true,
        maxlength: 200
    },
    category: {
        type: String,
        enum: ["order", "payment", "product", "shipping", "return", "account", "other"],
        required: true
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium"
    },
    status: {
        type: String,
        enum: ["open", "in_progress", "waiting_customer", "resolved", "closed"],
        default: "open"
    },
    messages: [messageSchema],
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    resolvedAt: Date
}, {
    timestamps: true
})

// Indexes
supportTicketSchema.index({ user: 1, createdAt: -1 })
supportTicketSchema.index({ ticketNumber: 1 }, { unique: true })
supportTicketSchema.index({ status: 1 })
supportTicketSchema.index({ category: 1 })
supportTicketSchema.index({ priority: 1 })

// Pre-save: Generate ticket number
supportTicketSchema.pre("save", async function () {
    if (this.isNew && !this.ticketNumber) {
        const date = new Date()
        const prefix = `BKC${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`
        const count = await mongoose.model("SupportTicket").countDocuments()
        this.ticketNumber = `${prefix}${String(count + 1).padStart(5, "0")}`
    }
})

// Static: Generate ticket number
supportTicketSchema.statics.generateTicketNumber = async function () {
    const date = new Date()
    const prefix = `BKC${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`
    const count = await this.countDocuments()
    return `${prefix}${String(count + 1).padStart(5, "0")}`
}

// Static: Get user tickets
supportTicketSchema.statics.getUserTickets = async function (
    userId: string,
    page = 1,
    limit = 10
) {
    const skip = (page - 1) * limit

    const [tickets, total] = await Promise.all([
        this.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("orderId", "orderNumber total")
            .lean(),
        this.countDocuments({ user: userId })
    ])

    return { tickets, total }
}

export const SupportTicket = (mongoose.models.SupportTicket as ISupportTicketModel) ||
    mongoose.model<ISupportTicket, ISupportTicketModel>("SupportTicket", supportTicketSchema)
