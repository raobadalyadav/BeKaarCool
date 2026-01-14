/**
 * Address Model (Standalone)
 * For managing user addresses separately
 */

import mongoose, { Document, Model } from "mongoose"

export interface IAddress extends Document {
    user: mongoose.Types.ObjectId
    type: "home" | "work" | "other"
    name: string
    phone: string
    alternatePhone?: string
    address: string
    landmark?: string
    city: string
    state: string
    pincode: string
    country: string
    isDefault: boolean
    isVerified: boolean
    coordinates?: {
        lat: number
        lng: number
    }
    createdAt: Date
    updatedAt: Date
}

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ["home", "work", "other"],
        default: "home"
    },
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        maxlength: 100
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        match: [/^[6-9]\d{9}$/, "Invalid phone number"]
    },
    alternatePhone: {
        type: String,
        match: [/^[6-9]\d{9}$/, "Invalid phone number"]
    },
    address: {
        type: String,
        required: [true, "Address is required"],
        maxlength: 500
    },
    landmark: {
        type: String,
        maxlength: 200
    },
    city: {
        type: String,
        required: [true, "City is required"],
        trim: true
    },
    state: {
        type: String,
        required: [true, "State is required"],
        trim: true
    },
    pincode: {
        type: String,
        required: [true, "Pincode is required"],
        match: [/^\d{6}$/, "Invalid pincode"]
    },
    country: {
        type: String,
        default: "India"
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    coordinates: {
        lat: Number,
        lng: Number
    }
}, {
    timestamps: true
})

// Indexes
addressSchema.index({ user: 1, isDefault: 1 })
addressSchema.index({ pincode: 1 })

// Ensure only one default address per user
addressSchema.pre("save", async function (next) {
    if (this.isModified("isDefault") && this.isDefault) {
        await mongoose.model("Address").updateMany(
            { user: this.user, _id: { $ne: this._id } },
            { isDefault: false }
        )
    }
    next()
})

// Static methods
addressSchema.statics.getUserAddresses = function (userId: string) {
    return this.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 }).lean()
}

addressSchema.statics.getDefaultAddress = function (userId: string) {
    return this.findOne({ user: userId, isDefault: true }).lean()
}

addressSchema.statics.setAsDefault = async function (userId: string, addressId: string) {
    await this.updateMany({ user: userId }, { isDefault: false })
    return this.findByIdAndUpdate(addressId, { isDefault: true }, { new: true })
}

export const Address = mongoose.models.Address ||
    mongoose.model<IAddress>("Address", addressSchema)
