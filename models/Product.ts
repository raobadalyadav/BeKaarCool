/**
 * Product Model
 * For managing product catalog
 */

import mongoose, { Document, Model } from "mongoose"

export interface IProductVariation {
  sizes: string[]
  colors: Array<{
    name: string
    code: string
    image?: string
  }>
  priceModifiers?: Map<string, number>
}

export interface IProductSEO {
  title?: string
  description?: string
  keywords?: string[]
  canonicalUrl?: string
  ogImage?: string
}

export interface IProduct extends Document {
  name: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  originalPrice?: number
  costPrice?: number
  images: string[]
  videos?: string[]
  thumbnail?: string
  category: mongoose.Types.ObjectId | string
  subcategory?: string
  brand?: string
  tags: string[]
  variations: IProductVariation
  attributes?: Map<string, string>
  stock: number
  lowStockThreshold: number
  sku?: string
  barcode?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  sold: number
  rating: number
  reviewCount: number
  reviews: mongoose.Types.ObjectId[]
  featured: boolean
  recommended: boolean
  newArrival: boolean
  bestSeller: boolean
  isActive: boolean
  isDigital: boolean
  seller: mongoose.Types.ObjectId
  seo: IProductSEO
  customizable: boolean
  customizationOptions?: {
    allowText: boolean
    allowImage: boolean
    maxTextLength?: number
    textAreas?: Array<{ name: string; x: number; y: number; maxChars: number }>
  }
  preorderAvailable: boolean
  preorderDate?: Date
  relatedProducts?: mongoose.Types.ObjectId[]
  frequentlyBoughtWith?: mongoose.Types.ObjectId[]
  views: number
  wishlistCount: number
  shareCount: number
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Color variation schema
const colorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true }, // Hex code
  image: String
}, { _id: false })

// Variations schema
const variationsSchema = new mongoose.Schema({
  sizes: [{ type: String }],
  colors: [colorSchema],
  priceModifiers: {
    type: Map,
    of: Number
  }
}, { _id: false })

// SEO schema
const seoSchema = new mongoose.Schema({
  title: { type: String, maxlength: 60 },
  description: { type: String, maxlength: 160 },
  keywords: [String],
  canonicalUrl: String,
  ogImage: String
}, { _id: false })

// Main Product Schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    maxlength: [200, "Name cannot exceed 200 characters"]
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    maxlength: [5000, "Description cannot exceed 5000 characters"]
  },
  shortDescription: {
    type: String,
    maxlength: 500
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"]
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  costPrice: {
    type: Number,
    min: 0,
    select: false // Don't expose cost price
  },
  images: {
    type: [String],
    validate: {
      validator: (v: string[]) => v.length >= 1,
      message: "At least one image is required"
    }
  },
  videos: [String],
  thumbnail: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Category is required"]
  },
  subcategory: String,
  brand: {
    type: String,
    trim: true
  },
  tags: [{ type: String, lowercase: true, trim: true }],
  variations: {
    type: variationsSchema,
    default: { sizes: [], colors: [] }
  },
  attributes: {
    type: Map,
    of: String
  },
  stock: {
    type: Number,
    required: true,
    min: [0, "Stock cannot be negative"],
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  barcode: String,
  weight: { type: Number, min: 0 }, // in grams
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  sold: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review"
  }],
  featured: { type: Boolean, default: false },
  recommended: { type: Boolean, default: false },
  newArrival: { type: Boolean, default: true },
  bestSeller: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isDigital: { type: Boolean, default: false },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  seo: {
    type: seoSchema,
    default: {}
  },
  customizable: { type: Boolean, default: false },
  customizationOptions: {
    allowText: { type: Boolean, default: false },
    allowImage: { type: Boolean, default: false },
    maxTextLength: { type: Number, default: 50 },
    textAreas: [{
      name: String,
      x: Number,
      y: Number,
      maxChars: Number
    }]
  },
  preorderAvailable: { type: Boolean, default: false },
  preorderDate: Date,
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }],
  frequentlyBoughtWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }],
  views: { type: Number, default: 0 },
  wishlistCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
  publishedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true }
})

// Indexes
productSchema.index({ slug: 1 }, { unique: true })
productSchema.index({ name: "text", description: "text", tags: "text", brand: "text" })
productSchema.index({ category: 1 })
productSchema.index({ subcategory: 1 })
productSchema.index({ brand: 1 })
productSchema.index({ price: 1 })
productSchema.index({ rating: -1 })
productSchema.index({ sold: -1 })
productSchema.index({ views: -1 })
productSchema.index({ featured: 1, isActive: 1 })
productSchema.index({ recommended: 1, isActive: 1 })
productSchema.index({ newArrival: 1, createdAt: -1 })
productSchema.index({ bestSeller: 1 })
productSchema.index({ seller: 1 })
productSchema.index({ sku: 1 }, { sparse: true })
productSchema.index({ createdAt: -1 })
productSchema.index({ stock: 1 })
productSchema.index({ tags: 1 })

// Virtuals
productSchema.virtual("discountPercentage").get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100)
})

productSchema.virtual("inStock").get(function () {
  return this.stock > 0
})

productSchema.virtual("isLowStock").get(function () {
  return this.stock > 0 && this.stock <= this.lowStockThreshold
})

productSchema.virtual("profitMargin").get(function () {
  if (!this.costPrice) return null
  return ((this.price - this.costPrice) / this.price) * 100
})

productSchema.virtual("primaryImage").get(function () {
  return this.thumbnail || this.images?.[0]
})

// Pre-save hooks
productSchema.pre("save", async function (next) {
  // Generate slug if not exists or name changed
  if (this.isModified("name") || this.isNew) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()

    // Check for duplicate slugs
    let slug = baseSlug
    let counter = 1
    const existingProduct = await mongoose.model("Product").findOne({
      slug,
      _id: { $ne: this._id }
    })

    while (existingProduct) {
      slug = `${baseSlug}-${counter}`
      counter++
      const duplicate = await mongoose.model("Product").findOne({
        slug,
        _id: { $ne: this._id }
      })
      if (!duplicate) break
    }

    this.slug = slug
  }

  // Generate SKU if not exists
  if (this.isNew && !this.sku) {
    const prefix = this.brand ? this.brand.substring(0, 3).toUpperCase() : "BKC"
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    this.sku = `${prefix}-${random}`
  }

  // Set SEO defaults
  if (!this.seo?.title) {
    this.seo = this.seo || {}
    this.seo.title = this.name.substring(0, 60)
  }
  if (!this.seo?.description) {
    this.seo.description = (this.shortDescription || this.description)?.substring(0, 160)
  }

  // Mark as new arrival for 30 days
  if (this.isNew) {
    this.newArrival = true
    this.publishedAt = new Date()
  }

  next()
})

// Post-save hook to update category product count
productSchema.post("save", async function () {
  if (this.category) {
    const count = await mongoose.model("Product").countDocuments({
      category: this.category,
      isActive: true
    })
    await mongoose.model("Category").findByIdAndUpdate(this.category, {
      productCount: count
    })
  }
})

// Instance methods
productSchema.methods.updateStock = async function (quantity: number) {
  this.stock = Math.max(0, this.stock + quantity)
  return this.save()
}

productSchema.methods.incrementViews = async function () {
  this.views += 1
  return this.save()
}

productSchema.methods.updateRating = async function () {
  const reviews = await mongoose.model("Review").find({ product: this._id })
  if (reviews.length === 0) {
    this.rating = 0
    this.reviewCount = 0
  } else {
    const total = reviews.reduce((sum: number, r: any) => sum + r.rating, 0)
    this.rating = Math.round((total / reviews.length) * 10) / 10
    this.reviewCount = reviews.length
  }
  return this.save()
}

// Static methods
productSchema.statics.getFeatured = function (limit: number = 10) {
  return this.find({ featured: true, isActive: true })
    .sort({ rating: -1, sold: -1 })
    .limit(limit)
    .lean()
}

productSchema.statics.getNewArrivals = function (limit: number = 10) {
  return this.find({ newArrival: true, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
}

productSchema.statics.getBestSellers = function (limit: number = 10) {
  return this.find({ isActive: true })
    .sort({ sold: -1 })
    .limit(limit)
    .lean()
}

productSchema.statics.getSimilar = function (productId: string, category: string, limit: number = 6) {
  return this.find({
    _id: { $ne: productId },
    category,
    isActive: true
  })
    .sort({ rating: -1, sold: -1 })
    .limit(limit)
    .lean()
}

productSchema.statics.getLowStock = function (threshold?: number) {
  return this.find({
    $expr: { $lte: ["$stock", threshold || "$lowStockThreshold"] },
    stock: { $gt: 0 },
    isActive: true
  }).lean()
}

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema)
