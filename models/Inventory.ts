/**
 * Inventory Model
 * For tracking stock levels, warehouses, and inventory movements
 */

import mongoose, { Document, Model } from "mongoose"

export interface IInventory extends Document {
    product: mongoose.Types.ObjectId
    sku: string
    warehouse: string
    quantity: number
    reservedQuantity: number
    availableQuantity: number
    reorderLevel: number
    reorderQuantity: number
    location?: {
        aisle?: string
        rack?: string
        bin?: string
    }
    lastRestockedAt?: Date
    lastSoldAt?: Date
    createdAt: Date
    updatedAt: Date
}

export interface IInventoryMovement extends Document {
    inventory: mongoose.Types.ObjectId
    product: mongoose.Types.ObjectId
    type: "in" | "out" | "adjustment" | "transfer" | "return" | "damage"
    quantity: number
    previousQuantity: number
    newQuantity: number
    reference?: {
        type: "order" | "purchase" | "return" | "manual" | "transfer"
        id?: mongoose.Types.ObjectId
    }
    reason?: string
    notes?: string
    performedBy: mongoose.Types.ObjectId
    createdAt: Date
}

// Inventory Schema
const inventorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    warehouse: {
        type: String,
        required: true,
        default: "main"
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    reservedQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    reorderLevel: {
        type: Number,
        default: 10,
        min: 0
    },
    reorderQuantity: {
        type: Number,
        default: 50,
        min: 1
    },
    location: {
        aisle: String,
        rack: String,
        bin: String
    },
    lastRestockedAt: Date,
    lastSoldAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true }
})

// Virtual for available quantity
inventorySchema.virtual("availableQuantity").get(function () {
    return Math.max(0, this.quantity - this.reservedQuantity)
})

// Virtual for stock status
inventorySchema.virtual("stockStatus").get(function () {
    const available = this.quantity - this.reservedQuantity
    if (available <= 0) return "out_of_stock"
    if (available <= this.reorderLevel) return "low_stock"
    return "in_stock"
})

// Indexes
inventorySchema.index({ product: 1, warehouse: 1 }, { unique: true })
inventorySchema.index({ sku: 1 }, { unique: true })
inventorySchema.index({ quantity: 1 })
inventorySchema.index({ warehouse: 1 })

// Static methods
inventorySchema.statics.getLowStock = function (warehouse?: string) {
    const query: any = {
        $expr: { $lte: ["$quantity", "$reorderLevel"] }
    }
    if (warehouse) query.warehouse = warehouse
    return this.find(query).populate("product", "name images")
}

inventorySchema.statics.getOutOfStock = function (warehouse?: string) {
    const query: any = { quantity: 0 }
    if (warehouse) query.warehouse = warehouse
    return this.find(query).populate("product", "name images")
}

// Inventory Movement Schema
const inventoryMovementSchema = new mongoose.Schema({
    inventory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory",
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    type: {
        type: String,
        enum: ["in", "out", "adjustment", "transfer", "return", "damage"],
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    previousQuantity: {
        type: Number,
        required: true
    },
    newQuantity: {
        type: Number,
        required: true
    },
    reference: {
        type: {
            type: String,
            enum: ["order", "purchase", "return", "manual", "transfer"]
        },
        id: mongoose.Schema.Types.ObjectId
    },
    reason: String,
    notes: String,
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
})

// Indexes
inventoryMovementSchema.index({ inventory: 1, createdAt: -1 })
inventoryMovementSchema.index({ product: 1, createdAt: -1 })
inventoryMovementSchema.index({ type: 1 })
inventoryMovementSchema.index({ "reference.type": 1, "reference.id": 1 })

export const Inventory = mongoose.models.Inventory ||
    mongoose.model<IInventory>("Inventory", inventorySchema)

export const InventoryMovement = mongoose.models.InventoryMovement ||
    mongoose.model<IInventoryMovement>("InventoryMovement", inventoryMovementSchema)
