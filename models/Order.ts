/**
 * Order Model
 * For managing customer orders
 */

import mongoose, { Document, Model } from "mongoose"

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "returned"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded"
export type PaymentMethod = "razorpay" | "phonepe" | "paytm" | "payu" | "stripe" | "cod" | "upi" | "card" | "netbanking" | "wallet"

export interface IOrderItem {
  product?: mongoose.Types.ObjectId
  customProduct?: {
    name: string
    type: string
    basePrice: number
    design?: string
  }
  name: string // Snapshot of product name at time of order
  image: string // Snapshot of product image
  quantity: number
  price: number
  originalPrice?: number
  size?: string
  color?: string
  sku?: string
  customization?: {
    design?: string
    text?: string
    position?: { x: number; y: number }
    font?: string
    textColor?: string
    elements?: any[]
    preview?: string
  }
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned"
  seller?: mongoose.Types.ObjectId
}

export interface IShippingAddress {
  name: string
  phone: string
  alternatePhone?: string
  address: string
  landmark?: string
  city: string
  state: string
  pincode: string
  country: string
  type?: "home" | "work" | "other"
}

export interface IOrder extends Document {
  orderNumber: string
  user: mongoose.Types.ObjectId
  customer: mongoose.Types.ObjectId
  items: IOrderItem[]
  subtotal: number
  shipping: number
  tax: number
  discount: number
  couponCode?: string
  couponDiscount: number
  total: number
  status: OrderStatus
  statusHistory: Array<{
    status: OrderStatus
    timestamp: Date
    note?: string
    by?: mongoose.Types.ObjectId
  }>
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  paymentId?: string
  paymentDetails?: {
    provider: string
    transactionId?: string
    method?: string
    last4?: string
    bank?: string
    vpa?: string
  }
  shippingAddress: IShippingAddress
  billingAddress?: IShippingAddress
  billingIsSameAsShipping: boolean
  shipment?: {
    provider?: string
    awbNumber?: string
    trackingUrl?: string
    label?: string
  }
  estimatedDelivery?: Date
  deliveredAt?: Date
  cancelledAt?: Date
  cancellationReason?: string
  cancelledBy?: "customer" | "seller" | "admin" | "system"
  returnRequest?: mongoose.Types.ObjectId
  refundDetails?: {
    amount: number
    reason: string
    processedAt?: Date
    transactionId?: string
  }
  notes?: string
  internalNotes?: string
  giftMessage?: string
  isGift: boolean
  invoiceNumber?: string
  invoiceUrl?: string
  affiliateCode?: string
  affiliateCommission: number
  loyaltyPointsEarned: number
  loyaltyPointsUsed: number
  source: "web" | "mobile" | "admin"
  ip?: string
  userAgent?: string
  createdAt: Date
  updatedAt: Date
}

// Order Item Schema
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  customProduct: {
    type: {
      name: { type: String },
      productType: { type: String },
      basePrice: { type: Number },
      design: { type: String }
    },
    default: null
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"]
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: 0
  },
  originalPrice: { type: Number, min: 0 },
  size: String,
  color: String,
  sku: String,
  customization: {
    design: String,
    text: String,
    position: { x: Number, y: Number },
    font: String,
    textColor: String,
    elements: [mongoose.Schema.Types.Mixed],
    preview: String
  },
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled", "returned"],
    default: "pending"
  },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { _id: true })

// Address Schema
const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  alternatePhone: String,
  address: { type: String, required: true },
  landmark: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: "India" },
  type: { type: String, enum: ["home", "work", "other"] }
}, { _id: false })

// Status History Schema
const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: String,
  by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { _id: false })

// Main Order Schema
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: (v: any[]) => v.length > 0,
      message: "Order must have at least one item"
    }
  },
  subtotal: { type: Number, required: true, min: 0 },
  shipping: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  couponCode: { type: String, uppercase: true },
  couponDiscount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },

  status: {
    type: String,
    enum: ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"],
    default: "pending"
  },
  statusHistory: [statusHistorySchema],

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
    default: "pending"
  },
  paymentMethod: {
    type: String,
    enum: ["razorpay", "phonepe", "paytm", "payu", "stripe", "cod", "upi", "card", "netbanking", "wallet"],
    required: true
  },
  paymentId: String,
  paymentDetails: {
    provider: String,
    transactionId: String,
    method: String,
    last4: String,
    bank: String,
    vpa: String
  },

  shippingAddress: { type: addressSchema, required: true },
  billingAddress: addressSchema,
  billingIsSameAsShipping: { type: Boolean, default: true },

  shipment: {
    provider: String,
    awbNumber: String,
    trackingUrl: String,
    label: String
  },
  estimatedDelivery: Date,
  deliveredAt: Date,

  cancelledAt: Date,
  cancellationReason: String,
  cancelledBy: { type: String, enum: ["customer", "seller", "admin", "system"] },

  returnRequest: { type: mongoose.Schema.Types.ObjectId, ref: "ReturnRequest" },
  refundDetails: {
    amount: Number,
    reason: String,
    processedAt: Date,
    transactionId: String
  },

  notes: String,
  internalNotes: { type: String, select: false },
  giftMessage: String,
  isGift: { type: Boolean, default: false },

  invoiceNumber: String,
  invoiceUrl: String,

  affiliateCode: String,
  affiliateCommission: { type: Number, default: 0, min: 0 },
  loyaltyPointsEarned: { type: Number, default: 0, min: 0 },
  loyaltyPointsUsed: { type: Number, default: 0, min: 0 },

  source: { type: String, enum: ["web", "mobile", "admin"], default: "web" },
  ip: String,
  userAgent: String
}, {
  timestamps: true,
  toJSON: { virtuals: true }
})

// Indexes
orderSchema.index({ orderNumber: 1 }, { unique: true })
orderSchema.index({ customer: 1, createdAt: -1 })
orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ status: 1 })
orderSchema.index({ paymentStatus: 1 })
orderSchema.index({ createdAt: -1 })
orderSchema.index({ "items.seller": 1 })
orderSchema.index({ "shippingAddress.pincode": 1 })
orderSchema.index({ paymentId: 1 })
orderSchema.index({ "shipment.awbNumber": 1 })

// Virtuals
orderSchema.virtual("itemCount").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0)
})

orderSchema.virtual("canCancel").get(function () {
  return ["pending", "confirmed"].includes(this.status)
})

orderSchema.virtual("canReturn").get(function () {
  if (this.status !== "delivered" || !this.deliveredAt) return false
  const daysSinceDelivery = (Date.now() - this.deliveredAt.getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceDelivery <= 7 // 7-day return window
})

// Pre-save hooks
orderSchema.pre("save", async function () {
  // Generate order number if new
  if (this.isNew && !this.orderNumber) {
    const date = new Date()
    const prefix = `BKC${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`
    const count = await mongoose.model("Order").countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    })
    this.orderNumber = `${prefix}${String(count + 1).padStart(5, "0")}`
  }

  // Generate invoice number if confirmed
  if (this.isModified("status") && this.status === "confirmed" && !this.invoiceNumber) {
    this.invoiceNumber = `INV-${this.orderNumber}`
  }

  // Add to status history if status changed
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    })

    if (this.status === "delivered") {
      this.deliveredAt = new Date()
    }
  }

  // Validate items
  for (const item of this.items) {
    if (!item.product && !item.customProduct?.name) {
      throw new Error("Each item must have either a product or customProduct")
    }
  }
})

// Instance methods
orderSchema.methods.updateStatus = async function (
  status: OrderStatus,
  note?: string,
  byUserId?: string
) {
  this.status = status
  this.statusHistory.push({
    status,
    timestamp: new Date(),
    note,
    by: byUserId
  })
  return this.save()
}

orderSchema.methods.cancel = async function (
  reason: string,
  cancelledBy: "customer" | "seller" | "admin" | "system"
) {
  if (!this.canCancel) {
    throw new Error("Order cannot be cancelled at this stage")
  }

  this.status = "cancelled"
  this.cancelledAt = new Date()
  this.cancellationReason = reason
  this.cancelledBy = cancelledBy

  return this.save()
}

// Static methods
orderSchema.statics.generateOrderNumber = async function (): Promise<string> {
  const date = new Date()
  const prefix = `BKC${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`
  const count = await this.countDocuments({
    createdAt: {
      $gte: new Date(date.getFullYear(), date.getMonth(), 1),
      $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
    }
  })
  return `${prefix}${String(count + 1).padStart(5, "0")}`
}

orderSchema.statics.getRevenueStats = async function (startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: "paid"
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
        avgOrderValue: { $avg: "$total" }
      }
    },
    { $sort: { _id: 1 } }
  ])
}

orderSchema.statics.getOrdersByStatus = function () {
  return this.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ])
}

export const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema)
