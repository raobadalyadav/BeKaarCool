/**
 * SavedCard Model
 * For storing tokenized payment methods (NOT full card numbers)
 */

import mongoose, { Document, Model } from "mongoose"

export interface ISavedCard extends Document {
    user: mongoose.Types.ObjectId
    type: "card" | "upi" | "netbanking"
    // For cards - only last 4 digits and card network stored
    cardLast4?: string
    cardNetwork?: "visa" | "mastercard" | "rupay" | "amex" | "discover"
    cardType?: "credit" | "debit"
    cardExpiry?: string // MM/YY format
    cardHolderName?: string
    // For UPI
    upiId?: string
    // Payment gateway token (encrypted reference, not actual card data)
    gatewayToken: string
    gateway: "razorpay" | "paytm" | "phonepe" | "stripe"
    isDefault: boolean
    nickname?: string
    createdAt: Date
    updatedAt: Date
}

interface ISavedCardModel extends Model<ISavedCard> {
    getUserCards(userId: string): Promise<ISavedCard[]>
    setDefault(userId: string, cardId: string): Promise<void>
}

const savedCardSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["card", "upi", "netbanking"],
        required: true
    },
    cardLast4: {
        type: String,
        match: /^\d{4}$/
    },
    cardNetwork: {
        type: String,
        enum: ["visa", "mastercard", "rupay", "amex", "discover"]
    },
    cardType: {
        type: String,
        enum: ["credit", "debit"]
    },
    cardExpiry: String,
    cardHolderName: String,
    upiId: {
        type: String,
        match: /^[\w.-]+@[\w]+$/
    },
    gatewayToken: {
        type: String,
        required: true,
        select: false // Never expose token in API responses
    },
    gateway: {
        type: String,
        enum: ["razorpay", "paytm", "phonepe", "stripe"],
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    nickname: String
}, {
    timestamps: true
})

// Indexes
savedCardSchema.index({ user: 1, isDefault: -1 })
savedCardSchema.index({ user: 1, type: 1 })

// Only one default per user
savedCardSchema.pre("save", async function () {
    if (this.isNew && this.isDefault) {
        await mongoose.model("SavedCard").updateMany(
            { user: this.user, isDefault: true },
            { isDefault: false }
        )
    }
})

// Get user's saved cards
savedCardSchema.statics.getUserCards = async function (userId: string) {
    return this.find({ user: userId })
        .sort({ isDefault: -1, createdAt: -1 })
        .lean()
}

// Set default card
savedCardSchema.statics.setDefault = async function (userId: string, cardId: string) {
    await this.updateMany({ user: userId }, { isDefault: false })
    await this.findByIdAndUpdate(cardId, { isDefault: true })
}

export const SavedCard = (mongoose.models.SavedCard as ISavedCardModel) ||
    mongoose.model<ISavedCard, ISavedCardModel>("SavedCard", savedCardSchema)
