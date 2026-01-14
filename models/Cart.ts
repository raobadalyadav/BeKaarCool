/**
 * Cart Model
 * For managing user shopping carts
 */

import mongoose, { Document, Model } from "mongoose"

export interface ICartItem {
  _id?: mongoose.Types.ObjectId
  product?: mongoose.Types.ObjectId
  customProduct?: {
    type: string
    name: string
    basePrice: number
    design?: string
  }
  quantity: number
  size: string
  color: string
  price: number
  originalPrice?: number
  customization?: {
    design?: string
    text?: string
    position?: { x: number; y: number }
    font?: string
    textColor?: string
    elements?: any[]
    canvasWidth?: number
    canvasHeight?: number
    preview?: string
  }
  addedAt: Date
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId
  items: ICartItem[]
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  couponCode?: string
  couponDiscount: number
  savedForLater: ICartItem[]
  lastActivity: Date
  abandonedEmailSent: boolean
  createdAt: Date
  updatedAt: Date
}

// Cart Item Schema
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  customProduct: {
    type: { type: String },
    name: String,
    basePrice: Number,
    design: String
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
    max: [10, "Maximum 10 items per product"]
  },
  size: {
    type: String,
    default: "M"
  },
  color: {
    type: String,
    default: "Default"
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  customization: {
    design: String,
    text: String,
    position: {
      x: Number,
      y: Number
    },
    font: String,
    textColor: String,
    elements: [mongoose.Schema.Types.Mixed],
    canvasWidth: Number,
    canvasHeight: Number,
    preview: String
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true })

// Main Cart Schema
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  couponCode: {
    type: String,
    uppercase: true
  },
  couponDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  savedForLater: [cartItemSchema],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  abandonedEmailSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
})

// Indexes
cartSchema.index({ user: 1 }, { unique: true })
cartSchema.index({ lastActivity: 1 })
cartSchema.index({ "items.product": 1 })

// Virtuals
cartSchema.virtual("itemCount").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0)
})

cartSchema.virtual("isEmpty").get(function () {
  return this.items.length === 0
})

cartSchema.virtual("freeShippingThreshold").get(function () {
  return 599 // Free shipping above ₹599
})

cartSchema.virtual("amountToFreeShipping").get(function () {
  const threshold = 599
  return Math.max(0, threshold - this.subtotal)
})

// Pre-save hook to calculate totals
cartSchema.pre("save", function () {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity)
  }, 0)

  // Calculate shipping (free above ₹599)
  this.shipping = this.subtotal >= 599 ? 0 : 49

  // Calculate tax (GST 18% - already included in price for fashion)
  this.tax = 0

  // Apply discount
  const discount = this.discount + this.couponDiscount

  // Calculate total
  this.total = Math.max(0, this.subtotal + this.shipping + this.tax - discount)

  // Update last activity
  this.lastActivity = new Date()
})

// Instance methods
cartSchema.methods.addItem = async function (item: Partial<ICartItem>) {
  // Check if item already exists with same product, size, and color
  const existingIndex = this.items.findIndex((i: ICartItem) =>
    i.product?.toString() === item.product?.toString() &&
    i.size === item.size &&
    i.color === item.color &&
    !i.customization?.design // Don't merge customized items
  )

  if (existingIndex > -1 && !item.customization?.design) {
    // Update quantity (max 10)
    this.items[existingIndex].quantity = Math.min(
      10,
      this.items[existingIndex].quantity + (item.quantity || 1)
    )
  } else {
    // Add new item
    this.items.push({
      ...item,
      addedAt: new Date()
    })
  }

  return this.save()
}

cartSchema.methods.updateItemQuantity = async function (itemId: string, quantity: number) {
  const item = this.items.id(itemId)
  if (item) {
    if (quantity <= 0) {
      item.deleteOne()
    } else {
      item.quantity = Math.min(10, quantity)
    }
  }
  return this.save()
}

cartSchema.methods.removeItem = async function (itemId: string) {
  const item = this.items.id(itemId)
  if (item) {
    item.deleteOne()
  }
  return this.save()
}

cartSchema.methods.clearCart = async function () {
  this.items = []
  this.couponCode = undefined
  this.couponDiscount = 0
  this.discount = 0
  return this.save()
}

cartSchema.methods.saveForLater = async function (itemId: string) {
  const itemIndex = this.items.findIndex((i: any) => i._id.toString() === itemId)
  if (itemIndex > -1) {
    const [item] = this.items.splice(itemIndex, 1)
    this.savedForLater.push(item)
  }
  return this.save()
}

cartSchema.methods.moveToCart = async function (itemId: string) {
  const itemIndex = this.savedForLater.findIndex((i: any) => i._id.toString() === itemId)
  if (itemIndex > -1) {
    const [item] = this.savedForLater.splice(itemIndex, 1)
    this.items.push({ ...item, addedAt: new Date() })
  }
  return this.save()
}

cartSchema.methods.applyCoupon = async function (code: string, discount: number) {
  this.couponCode = code.toUpperCase()
  this.couponDiscount = discount
  return this.save()
}

cartSchema.methods.removeCoupon = async function () {
  this.couponCode = undefined
  this.couponDiscount = 0
  return this.save()
}

// Static methods
cartSchema.statics.getOrCreateCart = async function (userId: string) {
  let cart = await this.findOne({ user: userId })
  if (!cart) {
    cart = await this.create({ user: userId, items: [] })
  }
  return cart
}

cartSchema.statics.getAbandonedCarts = function (hoursAgo: number = 24) {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
  return this.find({
    "items.0": { $exists: true }, // Has items
    lastActivity: { $lt: cutoff },
    abandonedEmailSent: false
  }).populate("user", "email name").lean()
}

cartSchema.statics.mergeGuestCart = async function (
  userId: string,
  guestItems: ICartItem[]
) {
  // Find or create cart for user
  let cart = await this.findOne({ user: userId })
  if (!cart) {
    cart = await this.create({ user: userId, items: [] })
  }

  for (const item of guestItems) {
    await cart.addItem(item)
  }

  return cart
}

export const Cart = mongoose.models.Cart || mongoose.model<ICart>("Cart", cartSchema)