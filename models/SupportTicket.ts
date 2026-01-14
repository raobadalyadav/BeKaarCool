/**
 * Support Ticket Model
 * For customer support management
 */

import mongoose, { Document, Model } from "mongoose"

export type TicketCategory = "order" | "product" | "payment" | "shipping" | "return" | "refund" | "account" | "technical" | "feedback" | "other"
export type TicketPriority = "low" | "medium" | "high" | "urgent"
export type TicketStatus = "open" | "in_progress" | "waiting_customer" | "waiting_internal" | "resolved" | "closed" | "reopened"

export interface ITicketMessage {
  sender: mongoose.Types.ObjectId
  senderType: "customer" | "agent" | "system"
  message: string
  attachments?: string[]
  isInternal: boolean
  timestamp: Date
  readAt?: Date
}

export interface ISupportTicket extends Document {
  ticketNumber: string
  user: mongoose.Types.ObjectId
  subject: string
  description: string
  category: TicketCategory
  subcategory?: string
  priority: TicketPriority
  status: TicketStatus
  order?: mongoose.Types.ObjectId
  product?: mongoose.Types.ObjectId
  assignedTo?: mongoose.Types.ObjectId
  assignedTeam?: string
  messages: ITicketMessage[]
  attachments: string[]
  tags: string[]
  satisfaction?: {
    rating: number
    feedback?: string
    ratedAt: Date
  }
  firstResponseAt?: Date
  resolvedAt?: Date
  closedAt?: Date
  reopenedAt?: Date
  slaDeadline?: Date
  slaBreach: boolean
  mergedWith?: mongoose.Types.ObjectId
  relatedTickets?: mongoose.Types.ObjectId[]
  source: "web" | "email" | "phone" | "chat" | "social"
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Message Schema
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  senderType: {
    type: String,
    enum: ["customer", "agent", "system"],
    required: true
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    maxlength: [5000, "Message cannot exceed 5000 characters"]
  },
  attachments: [String],
  isInternal: {
    type: Boolean,
    default: false // Internal notes not visible to customer
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  readAt: Date
}, { _id: true })

// Main Ticket Schema
const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"]
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true,
    maxlength: [200, "Subject cannot exceed 200 characters"]
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    maxlength: [5000, "Description cannot exceed 5000 characters"]
  },
  category: {
    type: String,
    enum: ["order", "product", "payment", "shipping", "return", "refund", "account", "technical", "feedback", "other"],
    required: [true, "Category is required"]
  },
  subcategory: String,
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },
  status: {
    type: String,
    enum: ["open", "in_progress", "waiting_customer", "waiting_internal", "resolved", "closed", "reopened"],
    default: "open"
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  assignedTeam: String,
  messages: [messageSchema],
  attachments: [String],
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  satisfaction: {
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, maxlength: 500 },
    ratedAt: Date
  },
  firstResponseAt: Date,
  resolvedAt: Date,
  closedAt: Date,
  reopenedAt: Date,
  slaDeadline: Date,
  slaBreach: {
    type: Boolean,
    default: false
  },
  mergedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SupportTicket"
  },
  relatedTickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "SupportTicket"
  }],
  source: {
    type: String,
    enum: ["web", "email", "phone", "chat", "social"],
    default: "web"
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
})

// Indexes
supportTicketSchema.index({ ticketNumber: 1 }, { unique: true })
supportTicketSchema.index({ user: 1, createdAt: -1 })
supportTicketSchema.index({ assignedTo: 1, status: 1 })
supportTicketSchema.index({ status: 1, priority: -1 })
supportTicketSchema.index({ category: 1 })
supportTicketSchema.index({ createdAt: -1 })
supportTicketSchema.index({ order: 1 })
supportTicketSchema.index({ tags: 1 })
supportTicketSchema.index({ slaDeadline: 1 })

// Virtuals
supportTicketSchema.virtual("isOpen").get(function () {
  return ["open", "in_progress", "waiting_customer", "waiting_internal", "reopened"].includes(this.status)
})

supportTicketSchema.virtual("responseTime").get(function () {
  if (!this.firstResponseAt) return null
  return this.firstResponseAt.getTime() - this.createdAt.getTime()
})

supportTicketSchema.virtual("resolutionTime").get(function () {
  if (!this.resolvedAt) return null
  return this.resolvedAt.getTime() - this.createdAt.getTime()
})

supportTicketSchema.virtual("messageCount").get(function () {
  return this.messages.filter(m => !m.isInternal).length
})

supportTicketSchema.virtual("lastActivity").get(function () {
  if (this.messages.length === 0) return this.createdAt
  return this.messages[this.messages.length - 1].timestamp
})

// Pre-save hooks
supportTicketSchema.pre("save", async function (next) {
  // Generate ticket number if new
  if (this.isNew && !this.ticketNumber) {
    const date = new Date()
    const prefix = `TKT${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    this.ticketNumber = `${prefix}-${random}`
  }

  // Set SLA deadline based on priority
  if (this.isNew || this.isModified("priority")) {
    const slaHours: Record<TicketPriority, number> = {
      urgent: 2,
      high: 8,
      medium: 24,
      low: 48
    }
    this.slaDeadline = new Date(Date.now() + slaHours[this.priority] * 60 * 60 * 1000)
  }

  // Check SLA breach
  if (this.slaDeadline && !this.firstResponseAt && new Date() > this.slaDeadline) {
    this.slaBreach = true
  }

  // Auto-set priority based on category for certain cases
  if (this.isNew && !this.isModified("priority")) {
    if (["payment", "refund"].includes(this.category)) {
      this.priority = "high"
    }
  }

  next()
})

// Instance methods
supportTicketSchema.methods.addMessage = async function (
  senderId: string,
  senderType: "customer" | "agent" | "system",
  message: string,
  attachments?: string[],
  isInternal: boolean = false
) {
  this.messages.push({
    sender: senderId,
    senderType,
    message,
    attachments,
    isInternal,
    timestamp: new Date()
  })

  // Set first response time if this is first agent response
  if (senderType === "agent" && !this.firstResponseAt) {
    this.firstResponseAt = new Date()
  }

  // Update status based on who replied
  if (senderType === "agent") {
    this.status = "waiting_customer"
  } else if (senderType === "customer" && this.status === "waiting_customer") {
    this.status = "in_progress"
  }

  return this.save()
}

supportTicketSchema.methods.assign = async function (agentId: string, team?: string) {
  this.assignedTo = agentId
  if (team) this.assignedTeam = team
  if (this.status === "open") this.status = "in_progress"
  return this.save()
}

supportTicketSchema.methods.resolve = async function (resolution?: string) {
  this.status = "resolved"
  this.resolvedAt = new Date()

  if (resolution) {
    await this.addMessage(this.assignedTo || this.user, "system", `Ticket resolved: ${resolution}`)
  }

  return this.save()
}

supportTicketSchema.methods.close = async function () {
  this.status = "closed"
  this.closedAt = new Date()
  return this.save()
}

supportTicketSchema.methods.reopen = async function (reason?: string) {
  this.status = "reopened"
  this.reopenedAt = new Date()
  this.resolvedAt = undefined
  this.closedAt = undefined

  if (reason) {
    await this.addMessage(this.user, "customer", `Ticket reopened: ${reason}`)
  }

  return this.save()
}

supportTicketSchema.methods.rate = async function (rating: number, feedback?: string) {
  this.satisfaction = {
    rating,
    feedback,
    ratedAt: new Date()
  }
  return this.save()
}

// Static methods
supportTicketSchema.statics.getOpenTickets = function (
  options: { assignedTo?: string; category?: string; priority?: string } = {}
) {
  const query: any = {
    status: { $in: ["open", "in_progress", "waiting_customer", "waiting_internal", "reopened"] }
  }
  if (options.assignedTo) query.assignedTo = options.assignedTo
  if (options.category) query.category = options.category
  if (options.priority) query.priority = options.priority

  return this.find(query)
    .sort({ priority: -1, createdAt: 1 })
    .populate("user", "name email")
    .populate("assignedTo", "name")
    .lean()
}

supportTicketSchema.statics.getTicketStats = async function (startDate?: Date, endDate?: Date) {
  const match: any = {}
  if (startDate) match.createdAt = { $gte: startDate }
  if (endDate) match.createdAt = { ...match.createdAt, $lte: endDate }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $in: ["$status", ["open", "in_progress", "waiting_customer", "waiting_internal", "reopened"]] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
        slaBreach: { $sum: { $cond: ["$slaBreach", 1, 0] } },
        avgSatisfaction: { $avg: "$satisfaction.rating" }
      }
    }
  ])

  // By category
  const byCategory = await this.aggregate([
    { $match: match },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])

  return {
    ...(stats[0] || { total: 0, open: 0, resolved: 0, closed: 0, slaBreach: 0, avgSatisfaction: null }),
    byCategory
  }
}

supportTicketSchema.statics.getAgentPerformance = async function (agentId: string, startDate?: Date, endDate?: Date) {
  const match: any = { assignedTo: new mongoose.Types.ObjectId(agentId) }
  if (startDate) match.createdAt = { $gte: startDate }
  if (endDate) match.createdAt = { ...match.createdAt, $lte: endDate }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        assigned: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0] } },
        avgResponseTime: { $avg: { $subtract: ["$firstResponseAt", "$createdAt"] } },
        avgResolutionTime: { $avg: { $subtract: ["$resolvedAt", "$createdAt"] } },
        avgSatisfaction: { $avg: "$satisfaction.rating" },
        slaBreach: { $sum: { $cond: ["$slaBreach", 1, 0] } }
      }
    }
  ])

  return stats[0] || {
    assigned: 0,
    resolved: 0,
    avgResponseTime: null,
    avgResolutionTime: null,
    avgSatisfaction: null,
    slaBreach: 0
  }
}

export const SupportTicket = mongoose.models.SupportTicket ||
  mongoose.model<ISupportTicket>("SupportTicket", supportTicketSchema)
