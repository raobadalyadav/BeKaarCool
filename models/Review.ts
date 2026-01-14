/**
 * Review Model
 * For product reviews and ratings
 */

import mongoose, { Document, Model } from "mongoose"

export interface IReview extends Document {
  user: mongoose.Types.ObjectId
  product: mongoose.Types.ObjectId
  order: mongoose.Types.ObjectId
  rating: number
  title?: string
  comment: string
  pros?: string[]
  cons?: string[]
  images?: string[]
  videos?: string[]
  verified: boolean
  helpful: number
  notHelpful: number
  helpfulVotes: mongoose.Types.ObjectId[]
  reported: boolean
  reportCount: number
  reportReasons?: string[]
  status: "pending" | "approved" | "rejected" | "flagged"
  adminNotes?: string
  response?: {
    message: string
    by: mongoose.Types.ObjectId
    at: Date
  }
  purchaseDate?: Date
  size?: string
  color?: string
  fitRating?: "runs_small" | "true_to_size" | "runs_large"
  qualityRating?: number
  valueRating?: number
  recommendProduct: boolean
  createdAt: Date
  updatedAt: Date
}

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"]
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product is required"]
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: [true, "Order is required"]
  },
  rating: {
    type: Number,
    required: [true, "Rating is required"],
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot exceed 5"]
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"]
  },
  comment: {
    type: String,
    required: [true, "Review comment is required"],
    trim: true,
    minlength: [10, "Review must be at least 10 characters"],
    maxlength: [2000, "Review cannot exceed 2000 characters"]
  },
  pros: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  images: [{
    type: String,
    validate: {
      validator: (v: string[]) => !v || v.length <= 5,
      message: "Maximum 5 images allowed"
    }
  }],
  videos: [{
    type: String,
    validate: {
      validator: (v: string[]) => !v || v.length <= 2,
      message: "Maximum 2 videos allowed"
    }
  }],
  verified: {
    type: Boolean,
    default: false
  },
  helpful: {
    type: Number,
    default: 0,
    min: 0
  },
  notHelpful: {
    type: Number,
    default: 0,
    min: 0
  },
  helpfulVotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  reported: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  },
  reportReasons: [String],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "flagged"],
    default: "pending"
  },
  adminNotes: {
    type: String,
    select: false
  },
  response: {
    message: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    at: Date
  },
  purchaseDate: Date,
  size: String,
  color: String,
  fitRating: {
    type: String,
    enum: ["runs_small", "true_to_size", "runs_large"]
  },
  qualityRating: {
    type: Number,
    min: 1,
    max: 5
  },
  valueRating: {
    type: Number,
    min: 1,
    max: 5
  },
  recommendProduct: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
})

// Indexes
reviewSchema.index({ product: 1, createdAt: -1 })
reviewSchema.index({ user: 1, createdAt: -1 })
reviewSchema.index({ order: 1 })
reviewSchema.index({ rating: -1 })
reviewSchema.index({ helpful: -1 })
reviewSchema.index({ status: 1 })
reviewSchema.index({ verified: 1 })
reviewSchema.index({ createdAt: -1 })

// Compound unique index - one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true })

// Virtuals
reviewSchema.virtual("helpfulnessScore").get(function () {
  const total = this.helpful + this.notHelpful
  if (total === 0) return 0
  return Math.round((this.helpful / total) * 100)
})

reviewSchema.virtual("isEditable").get(function () {
  const daysSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceCreation <= 7 // Editable for 7 days
})

// Pre-save hook
reviewSchema.pre("save", async function (next) {
  // Check if order exists and belongs to user
  if (this.isNew) {
    const order = await mongoose.model("Order").findOne({
      _id: this.order,
      customer: this.user,
      status: "delivered",
      "items.product": this.product
    })

    if (order) {
      this.verified = true
      this.purchaseDate = order.deliveredAt || order.createdAt
    }
  }

  // Auto-flag reviews with too many reports
  if (this.reportCount >= 3 && this.status === "approved") {
    this.status = "flagged"
  }

  next()
})

// Post-save hook to update product rating
reviewSchema.post("save", async function () {
  const Product = mongoose.model("Product")
  const product = await Product.findById(this.product)
  if (product) {
    await product.updateRating()
  }
})

// Post-remove hook to update product rating
reviewSchema.post("deleteOne", { document: true, query: false }, async function () {
  const Product = mongoose.model("Product")
  const product = await Product.findById(this.product)
  if (product) {
    await product.updateRating()
  }
})

// Instance methods
reviewSchema.methods.markHelpful = async function (userId: string) {
  if (this.helpfulVotes.includes(userId)) {
    return { success: false, message: "Already voted" }
  }

  this.helpfulVotes.push(userId)
  this.helpful += 1
  await this.save()

  return { success: true, helpful: this.helpful }
}

reviewSchema.methods.report = async function (reason: string) {
  this.reportCount += 1
  this.reportReasons = this.reportReasons || []
  this.reportReasons.push(reason)

  if (this.reportCount >= 3) {
    this.status = "flagged"
  }

  this.reported = true
  return this.save()
}

reviewSchema.methods.addResponse = async function (
  message: string,
  byUserId: string
) {
  this.response = {
    message,
    by: byUserId,
    at: new Date()
  }
  return this.save()
}

// Static methods
reviewSchema.statics.getProductReviews = function (
  productId: string,
  options: { page?: number; limit?: number; sort?: string; rating?: number } = {}
) {
  const { page = 1, limit = 10, sort = "-createdAt", rating } = options

  const query: any = { product: productId, status: "approved" }
  if (rating) query.rating = rating

  return this.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "name avatar")
    .lean()
}

reviewSchema.statics.getProductStats = async function (productId: string) {
  const stats = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: "approved" } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        fiveStars: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        fourStars: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        threeStars: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        twoStars: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        oneStar: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        verifiedCount: { $sum: { $cond: ["$verified", 1, 0] } },
        withImages: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ["$images", []] } }, 0] }, 1, 0] } },
        recommendCount: { $sum: { $cond: ["$recommendProduct", 1, 0] } }
      }
    }
  ])

  return stats[0] || {
    averageRating: 0,
    totalReviews: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0,
    verifiedCount: 0,
    withImages: 0,
    recommendCount: 0
  }
}

reviewSchema.statics.canUserReview = async function (
  userId: string,
  productId: string
): Promise<{ canReview: boolean; reason?: string }> {
  // Check if already reviewed
  const existingReview = await this.findOne({ user: userId, product: productId })
  if (existingReview) {
    return { canReview: false, reason: "You have already reviewed this product" }
  }

  // Check if user purchased this product
  const order = await mongoose.model("Order").findOne({
    customer: userId,
    status: "delivered",
    "items.product": productId
  })

  if (!order) {
    return { canReview: false, reason: "You must purchase this product to review it" }
  }

  return { canReview: true }
}

reviewSchema.statics.getPendingReviews = function () {
  return this.find({ status: "pending" })
    .sort({ createdAt: 1 })
    .populate("user", "name email")
    .populate("product", "name images")
    .lean()
}

export const Review = mongoose.models.Review || mongoose.model<IReview>("Review", reviewSchema)
