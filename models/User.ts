/**
 * User Model
 * Core user authentication and profile
 * 
 * NOTE: For scalability, the following features use SEPARATE collections:
 * - Addresses: Use `Address` model instead of embedded addresses
 * - Wishlist: Use `WishlistItem` model instead of embedded wishlist
 * - Sessions: Use `Session` model for multi-device tracking
 * - Referrals: Use `Referral` model for tracking referral relationships
 */

import mongoose, { Document, Model } from "mongoose"
import { IUser } from "@/lib/types/entities"

// User preferences subdocument (kept embedded as it's small and user-specific)
const preferencesSchema = new mongoose.Schema({
  language: { type: String, default: "en" },
  currency: { type: String, default: "INR" },
  newsletter: { type: Boolean, default: true },
  smsNotifications: { type: Boolean, default: true },
  pushNotifications: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: true },
  theme: { type: String, enum: ["light", "dark", "system"], default: "system" }
}, { _id: false })

// Main User Schema
const userSchema = new mongoose.Schema({
  // ============================================
  // Basic Info
  // ============================================
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
  },
  password: {
    type: String,
    select: false, // Never include in queries by default
    minlength: [8, "Password must be at least 8 characters"]
  },
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    sparse: true,
    match: [/^[6-9]\d{9}$/, "Please provide a valid Indian phone number"]
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ["male", "female", "other", "prefer_not_to_say"]
  },

  // ============================================
  // Role & Status
  // ============================================
  role: {
    type: String,
    enum: {
      values: ["customer", "seller", "admin", "super_admin"],
      message: "{VALUE} is not a valid role"
    },
    default: "customer"
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  bannedAt: Date,

  // ============================================
  // DEPRECATED: Use Address model instead
  // Keeping for backward compatibility, will be removed
  // ============================================
  // addresses: [addressSchema], // REMOVED - Use Address model

  // ============================================
  // Preferences (embedded - small, user-specific)
  // ============================================
  preferences: {
    type: preferencesSchema,
    default: () => ({})
  },

  // ============================================
  // DEPRECATED: Use WishlistItem model instead
  // Keeping for backward compatibility
  // ============================================
  // wishlist: [{ type: ObjectId, ref: "Product" }], // REMOVED - Use WishlistItem model

  // ============================================
  // Loyalty Program
  // ============================================
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: [0, "Points cannot be negative"]
  },
  loyaltyTier: {
    type: String,
    enum: ["bronze", "silver", "gold", "platinum"],
    default: "bronze"
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  },

  // ============================================
  // Referral System (basic fields, use Referral model for tracking)
  // ============================================
  affiliateCode: {
    type: String,
    unique: true,
    sparse: true // Allows null values
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  referralCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // ============================================
  // OAuth Providers
  // ============================================
  googleId: { type: String, sparse: true },
  facebookId: { type: String, sparse: true },

  // ============================================
  // Auth & Security (all select: false for security)
  // ============================================
  lastLogin: { type: Date },
  lastLoginIp: { type: String, select: false },
  loginAttempts: { type: Number, default: 0, select: false },
  lockUntil: { type: Date, select: false },

  // Password Reset
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },

  // Email Verification
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },

  // Phone Verification
  phoneVerificationCode: { type: String, select: false },
  phoneVerificationExpires: { type: Date, select: false },
  isPhoneVerified: { type: Boolean, default: false }
}, {
  timestamps: true, // Automatically manage createdAt/updatedAt
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret: Record<string, unknown>) {
      // Remove sensitive fields from JSON output
      delete ret.password
      delete ret.resetPasswordToken
      delete ret.resetPasswordExpires
      delete ret.emailVerificationToken
      delete ret.emailVerificationExpires
      delete ret.phoneVerificationCode
      delete ret.phoneVerificationExpires
      delete ret.loginAttempts
      delete ret.lockUntil
      delete ret.lastLoginIp
      delete ret.__v
      return ret
    }
  }
})

// ============================================
// INDEXES for performance (avoiding duplicates with field-level definitions)
// ============================================
userSchema.index({ role: 1 })
userSchema.index({ isActive: 1, isBanned: 1 })
userSchema.index({ createdAt: -1 })
userSchema.index({ loyaltyTier: 1 })

// Compound index for searching
userSchema.index({ name: "text", email: "text" })

// ============================================
// VIRTUAL FIELDS
// ============================================
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > new Date())
})

userSchema.virtual("displayName").get(function () {
  return this.name || this.email.split("@")[0]
})

userSchema.virtual("initials").get(function () {
  if (!this.name) return "?"
  const parts = this.name.split(" ")
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : this.name.substring(0, 2).toUpperCase()
})

// ============================================
// PRE-SAVE HOOKS
// ============================================
userSchema.pre("save", async function () {
  // Generate affiliate code if not exists
  if (this.isNew && !this.affiliateCode) {
    this.affiliateCode = "BKC" + this._id.toString().slice(-8).toUpperCase()
  }

  // Update loyalty tier based on total spent
  if (this.isModified("totalSpent")) {
    if (this.totalSpent >= 50000) {
      this.loyaltyTier = "platinum"
    } else if (this.totalSpent >= 25000) {
      this.loyaltyTier = "gold"
    } else if (this.totalSpent >= 10000) {
      this.loyaltyTier = "silver"
    } else {
      this.loyaltyTier = "bronze"
    }
  }
})

// ============================================
// INSTANCE METHODS
// ============================================
userSchema.methods.incrementLoginAttempts = async function () {
  // If we have a previous lock that has expired, restart
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    })
    return
  }

  const updates: any = { $inc: { loginAttempts: 1 } }

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) }
  }

  await this.updateOne(updates)
}

userSchema.methods.resetLoginAttempts = async function () {
  await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  })
}

userSchema.methods.updateLastLogin = async function (ip?: string) {
  const update: any = { lastLogin: new Date() }
  if (ip) update.lastLoginIp = ip
  await this.updateOne({ $set: update })
}

userSchema.methods.addLoyaltyPoints = async function (points: number, reason?: string) {
  this.loyaltyPoints += points
  await this.save()

  // Could log to ActivityLog here
  return this.loyaltyPoints
}

userSchema.methods.ban = async function (reason: string) {
  this.isBanned = true
  this.banReason = reason
  this.bannedAt = new Date()
  return this.save()
}

userSchema.methods.unban = async function () {
  this.isBanned = false
  this.banReason = undefined
  this.bannedAt = undefined
  return this.save()
}

// ============================================
// STATIC METHODS
// ============================================
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() })
}

userSchema.statics.findByEmailWithPassword = function (email: string) {
  return this.findOne({ email: email.toLowerCase() }).select("+password")
}

userSchema.statics.findByAffiliateCode = function (code: string) {
  return this.findOne({ affiliateCode: code.toUpperCase() })
}

userSchema.statics.search = function (query: string, limit: number = 20) {
  return this.find(
    { $text: { $search: query }, isActive: true },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .select("name email avatar role")
    .lean()
}

userSchema.statics.getCustomerStats = async function () {
  return this.aggregate([
    { $match: { role: "customer" } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        verified: { $sum: { $cond: ["$isVerified", 1, 0] } },
        active: { $sum: { $cond: ["$isActive", 1, 0] } },
        banned: { $sum: { $cond: ["$isBanned", 1, 0] } },
        byTier: {
          $push: "$loyaltyTier"
        }
      }
    }
  ])
}

// ============================================
// EXPORT
// ============================================
export interface IUserDocument extends Omit<IUser, '_id'>, Document { }
export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>
  findByEmailWithPassword(email: string): Promise<IUserDocument | null>
  findByAffiliateCode(code: string): Promise<IUserDocument | null>
  search(query: string, limit?: number): Promise<IUserDocument[]>
  getCustomerStats(): Promise<unknown>
}

export const User = mongoose.models.User || mongoose.model<IUserDocument, IUserModel>("User", userSchema)
