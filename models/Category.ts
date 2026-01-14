/**
 * Category Model
 * For product categorization with hierarchy support
 */

import mongoose, { Document, Model } from "mongoose"

export interface ICategory extends Document {
    name: string
    slug: string
    description?: string
    image?: string
    icon?: string
    parent?: mongoose.Types.ObjectId
    ancestors: mongoose.Types.ObjectId[]
    level: number
    position: number
    isActive: boolean
    isFeatured: boolean
    productCount: number
    seo: {
        title?: string
        description?: string
        keywords?: string[]
    }
    filters: Array<{
        name: string
        type: "select" | "range" | "checkbox"
        options?: string[]
        min?: number
        max?: number
    }>
    createdAt: Date
    updatedAt: Date
}

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
        trim: true,
        maxlength: [100, "Name cannot exceed 100 characters"]
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        maxlength: [1000, "Description cannot exceed 1000 characters"]
    },
    image: {
        type: String
    },
    icon: {
        type: String // Icon class or SVG path
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    ancestors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    }],
    level: {
        type: Number,
        default: 0,
        min: 0
    },
    position: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    productCount: {
        type: Number,
        default: 0
    },
    seo: {
        title: { type: String, maxlength: 60 },
        description: { type: String, maxlength: 160 },
        keywords: [String]
    },
    filters: [{
        name: { type: String, required: true },
        type: {
            type: String,
            enum: ["select", "range", "checkbox"],
            default: "checkbox"
        },
        options: [String],
        min: Number,
        max: Number
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// Indexes
categorySchema.index({ slug: 1 }, { unique: true })
categorySchema.index({ parent: 1 })
categorySchema.index({ isActive: 1 })
categorySchema.index({ isFeatured: 1 })
categorySchema.index({ level: 1, position: 1 })
categorySchema.index({ name: "text", description: "text" })

// Virtual for getting children
categorySchema.virtual("children", {
    ref: "Category",
    localField: "_id",
    foreignField: "parent"
})

// Pre-save hook to generate slug and set ancestors
categorySchema.pre("save", async function (next) {
    // Generate slug from name if not set
    if (this.isModified("name") && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim()
    }

    // Update ancestors and level if parent changed
    if (this.isModified("parent")) {
        if (this.parent) {
            const parent = await mongoose.model("Category").findById(this.parent)
            if (parent) {
                this.ancestors = [...parent.ancestors, parent._id]
                this.level = parent.level + 1
            }
        } else {
            this.ancestors = []
            this.level = 0
        }
    }

    next()
})

// Static method to get category tree
categorySchema.statics.getTree = async function () {
    const categories = await this.find({ isActive: true })
        .sort({ level: 1, position: 1 })
        .lean()

    const buildTree = (items: any[], parentId: string | null = null): any[] => {
        return items
            .filter(item => {
                const itemParent = item.parent?.toString() || null
                return itemParent === parentId
            })
            .map(item => ({
                ...item,
                children: buildTree(items, item._id.toString())
            }))
    }

    return buildTree(categories)
}

// Static method to get breadcrumb
categorySchema.statics.getBreadcrumb = async function (categoryId: string) {
    const category = await this.findById(categoryId)
        .populate("ancestors", "name slug")
        .lean()

    if (!category) return []

    return [
        ...category.ancestors.map((a: any) => ({ name: a.name, slug: a.slug })),
        { name: category.name, slug: category.slug }
    ]
}

export const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", categorySchema)
