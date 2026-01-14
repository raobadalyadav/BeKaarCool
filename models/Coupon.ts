/**
 * Coupon Model
 * For discount codes and promotional offers
 */

import mongoose, { Document, Model } from "mongoose"

export interface ICoupon extends Document {
  code: string
  name?: string
  description: string
  discountType: "percentage" | "fixed" | "free_shipping" | "bogo"
  discountValue: number
  maxDiscountAmount?: number
  minOrderAmount: number
  usageLimit?: number
  usageLimitPerUser: number
  usedCount: number
  validFrom: Date
  validTo: Date
  isActive: boolean
  isPublic: boolean
  applicableCategories: string[]
  applicableProducts: mongoose.Types.ObjectId[]
  excludedProducts: mongoose.Types.ObjectId[]
  applicableUsers: mongoose.Types.ObjectId[]
  firstOrderOnly: boolean
  stackable: boolean
  termsAndConditions?: string
  createdBy: mongoose.Types.ObjectId
  usageHistory: Array<{
    user: mongoose.Types.ObjectId
    order: mongoose.Types.ObjectId
    discountApplied: number
    usedAt: Date
  }>
  createdAt: Date
  updatedAt: Date
}

const couponUsageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  discountApplied: { type: Number, required: true },
  usedAt: { type: Date, default: Date.now }
}, { _id: false })

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, "Coupon code is required"],
    uppercase: true,
    trim: true,
    unique: true,
    maxlength: [20, "Code cannot exceed 20 characters"],
    match: [/^[A-Z0-9]+$/, "Code can only contain letters and numbers"]
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    maxlength: 500
  },
  discountType: {
    type: String,
    enum: {
      values: ["percentage", "fixed", "free_shipping", "bogo"],
      message: "{VALUE} is not a valid discount type"
    },
    required: true
  },
  discountValue: {
    type: Number,
    required: [true, "Discount value is required"],
    min: [0, "Discount value cannot be negative"],
    validate: {
      validator: function (this: ICoupon, v: number) {
        if (this.discountType === "percentage" && v > 100) return false
        return true
      },
      message: "Percentage discount cannot exceed 100%"
    }
  },
  maxDiscountAmount: {
    type: Number,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  usageLimit: {
    type: Number,
    min: 1
  },
  usageLimitPerUser: {
    type: Number,
    default: 1,
    min: 1
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  validFrom: {
    type: Date,
    required: [true, "Start date is required"]
  },
  validTo: {
    type: Date,
    required: [true, "End date is required"],
    validate: {
      validator: function (this: ICoupon, v: Date) {
        return v > this.validFrom
      },
      message: "End date must be after start date"
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false // Hidden coupons for specific users
  },
  applicableCategories: [{
    type: String,
    trim: true
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }],
  applicableUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  firstOrderOnly: {
    type: Boolean,
    default: false
  },
  stackable: {
    type: Boolean,
    default: false
  },
  termsAndConditions: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  usageHistory: [couponUsageSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true }
})

// Indexes
couponSchema.index({ code: 1 }, { unique: true })
couponSchema.index({ validFrom: 1, validTo: 1 })
couponSchema.index({ isActive: 1, isPublic: 1 })
couponSchema.index({ discountType: 1 })
couponSchema.index({ createdAt: -1 })

// Virtuals
couponSchema.virtual("isExpired").get(function () {
  return new Date() > this.validTo
})

couponSchema.virtual("isValid").get(function () {
  const now = new Date()
  return this.isActive && now >= this.validFrom && now <= this.validTo &&
    (!this.usageLimit || this.usedCount < this.usageLimit)
})

couponSchema.virtual("remainingUses").get(function () {
  if (!this.usageLimit) return Infinity
  return Math.max(0, this.usageLimit - this.usedCount)
})

// Static methods
couponSchema.statics.findByCode = function (code: string) {
  return this.findOne({ code: code.toUpperCase().trim() })
}

couponSchema.statics.validateCoupon = async function (
  code: string,
  userId: string,
  cartTotal: number,
  productIds: string[],
  categories: string[]
): Promise<{ valid: boolean; coupon?: ICoupon; error?: string; discount?: number }> {
  const coupon = await this.findOne({ code: code.toUpperCase().trim() })

  if (!coupon) {
    return { valid: false, error: "Invalid coupon code" }
  }

  const now = new Date()

  // Check if active
  if (!coupon.isActive) {
    return { valid: false, error: "This coupon is no longer active" }
  }

  // Check date validity
  if (now < coupon.validFrom) {
    return { valid: false, error: "This coupon is not yet active" }
  }
  if (now > coupon.validTo) {
    return { valid: false, error: "This coupon has expired" }
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, error: "This coupon has reached its usage limit" }
  }

  // Check user usage limit
  const userUsageCount = coupon.usageHistory.filter(
    (u: any) => u.user.toString() === userId
  ).length
  if (userUsageCount >= coupon.usageLimitPerUser) {
    return { valid: false, error: "You have already used this coupon" }
  }

  // Check minimum order amount
  if (cartTotal < coupon.minOrderAmount) {
    return { valid: false, error: `Minimum order amount is ₹${coupon.minOrderAmount}` }
  }

  // Check first order only
  if (coupon.firstOrderOnly) {
    const Order = mongoose.model("Order")
    const hasOrders = await Order.exists({ customer: userId })
    if (hasOrders) {
      return { valid: false, error: "This coupon is for first orders only" }
    }
  }

  // Check applicable users
  if (coupon.applicableUsers.length > 0) {
    if (!coupon.applicableUsers.some((u: any) => u.toString() === userId)) {
      return { valid: false, error: "This coupon is not available for your account" }
    }
  }

  // Check applicable categories/products
  if (coupon.applicableCategories.length > 0) {
    const hasCategory = categories.some(c => coupon.applicableCategories.includes(c))
    if (!hasCategory) {
      return { valid: false, error: "This coupon is not applicable to items in your cart" }
    }
  }

  // Calculate discount
  let discount = 0
  if (coupon.discountType === "percentage") {
    discount = (cartTotal * coupon.discountValue) / 100
    if (coupon.maxDiscountAmount) {
      discount = Math.min(discount, coupon.maxDiscountAmount)
    }
  } else if (coupon.discountType === "fixed") {
    discount = Math.min(coupon.discountValue, cartTotal)
  } else if (coupon.discountType === "free_shipping") {
    discount = 0 // Handled separately
  }

  return { valid: true, coupon, discount: Math.round(discount) }
}

couponSchema.statics.recordUsage = async function (
  couponId: string,
  userId: string,
  orderId: string,
  discountApplied: number
) {
  return this.findByIdAndUpdate(couponId, {
    $inc: { usedCount: 1 },
    $push: {
      usageHistory: {
        user: userId,
        order: orderId,
        discountApplied,
        usedAt: new Date()
      }
    }
  })
}

couponSchema.statics.getPublicCoupons = function () {
  const now = new Date()
  return this.find({
    isActive: true,
    isPublic: true,
    validFrom: { $lte: now },
    validTo: { $gte: now }
  }).select("-usageHistory").lean()
}

export const Coupon = mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", couponSchema)
