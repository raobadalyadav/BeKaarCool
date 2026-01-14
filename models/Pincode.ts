/**
 * Pincode/Serviceability Model
 * For managing delivery areas and serviceability
 */

import mongoose, { Document, Model } from "mongoose"

export interface IPincode extends Document {
    pincode: string
    city: string
    state: string
    country: string
    isServiceable: boolean
    codAvailable: boolean
    expressDelivery: boolean
    standardDays: number // Standard delivery days
    expressDays: number  // Express delivery days
    deliveryCharge: number
    expressCharge: number
    freeDeliveryAbove: number
    slots?: Array<{
        label: string
        startHour: number
        endHour: number
        cutoffHour: number // Order before this hour to get this slot
        extraCharge: number
    }>
    createdAt: Date
    updatedAt: Date
}

interface IPincodeModel extends Model<IPincode> {
    checkServiceability(pincode: string): Promise<{
        isServiceable: boolean
        details?: {
            city: string
            state: string
            codAvailable: boolean
            standardDays: number
            expressDays: number
            deliveryCharge: number
            expressCharge: number
            freeDeliveryAbove: number
            slots: Array<{
                label: string
                date: string
                extraCharge: number
            }>
        }
    }>
}

const slotSchema = new mongoose.Schema({
    label: { type: String, required: true }, // "Morning", "Afternoon", etc.
    startHour: { type: Number, required: true },
    endHour: { type: Number, required: true },
    cutoffHour: { type: Number, required: true },
    extraCharge: { type: Number, default: 0 }
}, { _id: false })

const pincodeSchema = new mongoose.Schema({
    pincode: {
        type: String,
        required: true,
        unique: true,
        match: /^\d{6}$/
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
        default: "India"
    },
    isServiceable: {
        type: Boolean,
        default: true
    },
    codAvailable: {
        type: Boolean,
        default: true
    },
    expressDelivery: {
        type: Boolean,
        default: false
    },
    standardDays: {
        type: Number,
        default: 5,
        min: 1
    },
    expressDays: {
        type: Number,
        default: 2,
        min: 1
    },
    deliveryCharge: {
        type: Number,
        default: 40,
        min: 0
    },
    expressCharge: {
        type: Number,
        default: 99,
        min: 0
    },
    freeDeliveryAbove: {
        type: Number,
        default: 499,
        min: 0
    },
    slots: [slotSchema]
}, {
    timestamps: true
})

// Indexes
pincodeSchema.index({ pincode: 1 }, { unique: true })
pincodeSchema.index({ city: 1 })
pincodeSchema.index({ state: 1 })
pincodeSchema.index({ isServiceable: 1 })

// Static: Check serviceability and get delivery options
pincodeSchema.statics.checkServiceability = async function (pincode: string) {
    const data = await this.findOne({ pincode })

    if (!data || !data.isServiceable) {
        return { isServiceable: false }
    }

    // Calculate delivery dates
    const now = new Date()
    const standardDate = new Date(now.getTime() + data.standardDays * 24 * 60 * 60 * 1000)
    const expressDate = data.expressDelivery
        ? new Date(now.getTime() + data.expressDays * 24 * 60 * 60 * 1000)
        : null

    // Calculate available slots for next 3 days
    const slots: Array<{ label: string; date: string; extraCharge: number }> = []

    if (data.slots && data.slots.length > 0) {
        for (let dayOffset = data.standardDays; dayOffset <= data.standardDays + 2; dayOffset++) {
            const slotDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000)
            const dateStr = slotDate.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short"
            })

            for (const slot of data.slots) {
                // Check if slot is still available (based on cutoff)
                if (dayOffset === data.standardDays) {
                    const currentHour = now.getHours()
                    if (currentHour >= slot.cutoffHour) continue
                }

                slots.push({
                    label: `${dateStr}, ${slot.label} (${slot.startHour}:00 - ${slot.endHour}:00)`,
                    date: slotDate.toISOString(),
                    extraCharge: slot.extraCharge
                })
            }
        }
    }

    return {
        isServiceable: true,
        details: {
            city: data.city,
            state: data.state,
            codAvailable: data.codAvailable,
            standardDays: data.standardDays,
            expressDays: data.expressDays,
            deliveryCharge: data.deliveryCharge,
            expressCharge: data.expressCharge,
            freeDeliveryAbove: data.freeDeliveryAbove,
            slots
        }
    }
}

export const Pincode = (mongoose.models.Pincode as IPincodeModel) ||
    mongoose.model<IPincode, IPincodeModel>("Pincode", pincodeSchema)
