import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    select: false,
  },
  avatar: String,
  phone: String,
  role: {
    type: String,
    enum: ["customer", "seller", "admin"],
    default: "customer",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  addresses: [
    {
      name: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
      isDefault: Boolean,
    },
  ],
  preferences: {
    language: {
      type: String,
      default: "en",
    },
    currency: {
      type: String,
      default: "INR",
    },
    newsletter: {
      type: Boolean,
      default: true,
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
  },
  lastLogin: Date,
  resetToken: String,
  resetTokenExpiry: Date,
  verificationToken: String,
  verificationTokenExpiry: Date,
  affiliateCode: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

userSchema.index({ role: 1 })
userSchema.index({ createdAt: -1 })

export const User = mongoose.models.User || mongoose.model("User", userSchema)
