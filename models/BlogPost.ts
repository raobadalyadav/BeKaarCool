/**
 * Blog Post Model
 * For blog articles and content marketing
 */

import mongoose, { Document, Model } from "mongoose"

export interface ISeo {
    metaTitle?: string
    metaDescription?: string
    focusKeyword?: string
    canonicalUrl?: string
    ogImage?: string
    noIndex?: boolean
}

export interface IBlogPost extends Document {
    title: string
    slug: string
    excerpt: string
    content: string
    coverImage: string
    category: string
    author: mongoose.Types.ObjectId
    authorName?: string
    readTime: number
    tags: string[]
    status: "draft" | "published" | "archived"
    isPublished: boolean
    views: number
    likes: number
    seo?: ISeo
    featured?: boolean
    publishedAt?: Date
    createdAt: Date
    updatedAt: Date
}

interface IBlogPostModel extends Model<IBlogPost> {
    findBySlug(slug: string): Promise<IBlogPost | null>
    getPublished(page: number, limit: number): Promise<{ posts: IBlogPost[]; total: number }>
    getByCategory(category: string, limit?: number): Promise<IBlogPost[]>
    incrementViews(postId: string): Promise<void>
}

const blogPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        maxlength: [200, "Title cannot exceed 200 characters"]
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    excerpt: {
        type: String,
        required: [true, "Excerpt is required"],
        maxlength: [500, "Excerpt cannot exceed 500 characters"]
    },
    content: {
        type: String,
        required: [true, "Content is required"]
    },
    coverImage: {
        type: String,
        default: "/placeholder.svg"
    },
    category: {
        type: String,
        required: true,
        enum: ["Fashion", "Style Guide", "Trends", "Sustainability", "Tips", "News"],
        default: "Fashion"
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    authorName: {
        type: String,
        default: "BeKaarCool Team"
    },
    readTime: {
        type: Number,
        default: 5,
        min: 1
    },
    tags: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    status: {
        type: String,
        enum: ["draft", "published", "archived"],
        default: "draft"
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    likes: {
        type: Number,
        default: 0,
        min: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    seo: {
        metaTitle: String,
        metaDescription: String,
        focusKeyword: String,
        canonicalUrl: String,
        ogImage: String,
        noIndex: { type: Boolean, default: false }
    },
    publishedAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// Indexes
blogPostSchema.index({ slug: 1 }, { unique: true })
blogPostSchema.index({ status: 1, publishedAt: -1 })
blogPostSchema.index({ category: 1 })
blogPostSchema.index({ tags: 1 })
blogPostSchema.index({ title: "text", content: "text" })

// Pre-save hook to generate slug
blogPostSchema.pre("save", function (next) {
    if (this.isModified("title") && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
    }

    // Calculate read time from content (avg 200 words/min)
    if (this.isModified("content")) {
        const wordCount = this.content.split(/\s+/).length
        this.readTime = Math.max(1, Math.ceil(wordCount / 200))
    }

    // Set publishedAt when first published
    if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
        this.publishedAt = new Date()
        this.isPublished = true
    }

})

// Static methods
blogPostSchema.statics.findBySlug = function (slug: string) {
    return this.findOne({ slug, status: "published" })
        .populate("author", "name avatar")
}

blogPostSchema.statics.getPublished = async function (page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
        this.find({ status: "published" })
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("author", "name avatar"),
        this.countDocuments({ status: "published" })
    ])

    return { posts, total }
}

blogPostSchema.statics.getByCategory = function (category: string, limit = 10) {
    return this.find({ status: "published", category })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .populate("author", "name avatar")
}

blogPostSchema.statics.incrementViews = async function (postId: string) {
    await this.findByIdAndUpdate(postId, { $inc: { views: 1 } })
}

export const BlogPost = mongoose.models.BlogPost ||
    mongoose.model<IBlogPost, IBlogPostModel>("BlogPost", blogPostSchema)
