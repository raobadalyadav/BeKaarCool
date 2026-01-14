/**
 * Shipment Model
 * For tracking order shipments
 */

import mongoose, { Document, Model } from "mongoose"

export interface IShipment extends Document {
    order: mongoose.Types.ObjectId
    provider: "shiprocket" | "delhivery" | "bluedart" | "ecomexpress" | "manual"
    awbNumber: string
    shipmentId?: string
    status: "created" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "returned" | "cancelled"
    trackingUrl?: string
    estimatedDelivery?: Date
    actualDelivery?: Date
    weight: number
    dimensions?: {
        length: number
        breadth: number
        height: number
    }
    pickupAddress: {
        name: string
        address: string
        city: string
        state: string
        pincode: string
        phone: string
    }
    deliveryAddress: {
        name: string
        address: string
        city: string
        state: string
        pincode: string
        phone: string
    }
    trackingHistory: Array<{
        status: string
        location: string
        timestamp: Date
        remarks?: string
    }>
    shippingLabel?: string
    invoice?: string
    podImage?: string
    deliveryAttempts: number
    lastAttemptAt?: Date
    returnReason?: string
    createdAt: Date
    updatedAt: Date
}

const shipmentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    provider: {
        type: String,
        enum: ["shiprocket", "delhivery", "bluedart", "ecomexpress", "manual"],
        required: true
    },
    awbNumber: {
        type: String,
        required: true,
        unique: true
    },
    shipmentId: String,
    status: {
        type: String,
        enum: ["created", "picked_up", "in_transit", "out_for_delivery", "delivered", "returned", "cancelled"],
        default: "created"
    },
    trackingUrl: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    weight: {
        type: Number,
        required: true,
        min: 0
    },
    dimensions: {
        length: Number,
        breadth: Number,
        height: Number
    },
    pickupAddress: {
        name: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        phone: { type: String, required: true }
    },
    deliveryAddress: {
        name: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        phone: { type: String, required: true }
    },
    trackingHistory: [{
        status: { type: String, required: true },
        location: String,
        timestamp: { type: Date, default: Date.now },
        remarks: String
    }],
    shippingLabel: String,
    invoice: String,
    podImage: String, // Proof of delivery
    deliveryAttempts: {
        type: Number,
        default: 0
    },
    lastAttemptAt: Date,
    returnReason: String
}, {
    timestamps: true
})

// Indexes
shipmentSchema.index({ order: 1 })
shipmentSchema.index({ awbNumber: 1 }, { unique: true })
shipmentSchema.index({ provider: 1 })
shipmentSchema.index({ status: 1 })
shipmentSchema.index({ createdAt: -1 })

// Instance method to add tracking event
shipmentSchema.methods.addTrackingEvent = function (event: {
    status: string
    location: string
    remarks?: string
}) {
    this.trackingHistory.push({
        ...event,
        timestamp: new Date()
    })
    return this.save()
}

// Static methods
shipmentSchema.statics.getByOrder = function (orderId: string) {
    return this.findOne({ order: orderId })
        .sort({ createdAt: -1 })
        .lean()
}

shipmentSchema.statics.getPendingShipments = function () {
    return this.find({
        status: { $in: ["created", "picked_up", "in_transit", "out_for_delivery"] }
    })
        .populate("order", "orderNumber")
        .sort({ createdAt: -1 })
        .lean()
}

shipmentSchema.statics.updateFromWebhook = async function (
    awbNumber: string,
    status: string,
    trackingEvent: { status: string; location: string; remarks?: string }
) {
    const shipment = await this.findOne({ awbNumber })
    if (!shipment) return null

    shipment.status = status
    shipment.trackingHistory.push({
        ...trackingEvent,
        timestamp: new Date()
    })

    if (status === "delivered") {
        shipment.actualDelivery = new Date()
    }

    return shipment.save()
}

export const Shipment = mongoose.models.Shipment ||
    mongoose.model<IShipment>("Shipment", shipmentSchema)
