/**
 * Product Repository
 * Data access layer for Product model
 */

import { BaseRepository } from "./base.repository"
import { Product } from "@/models/Product"
import { IProduct, IProductFilters, IPaginationOptions } from "@/lib/types/entities"
import { FilterQuery } from "mongoose"

class ProductRepository extends BaseRepository<IProduct> {
    constructor() {
        super(Product)
    }

    /**
     * Find product by slug
     */
    async findBySlug(slug: string): Promise<IProduct | null> {
        return this.model.findOne({ slug, isActive: true })
            .populate("seller", "name email avatar")
            .lean<IProduct>()
    }

    /**
     * Find product with reviews populated
     */
    async findByIdWithReviews(id: string): Promise<IProduct | null> {
        if (!this.isValidObjectId(id)) return null
        return this.model.findById(id)
            .populate("seller", "name email avatar")
            .populate({
                path: "reviews",
                populate: { path: "user", select: "name avatar" }
            })
            .lean<IProduct>()
    }

    /**
     * Search products with filters
     */
    async searchWithFilters(
        filters: IProductFilters,
        pagination: IPaginationOptions
    ): Promise<any> {
        const query: FilterQuery<IProduct> = { isActive: true }

        // Category filter
        if (filters.category) {
            query.category = { $regex: new RegExp(filters.category, "i") }
        }

        // Subcategory filter
        if (filters.subcategory) {
            query.subcategory = filters.subcategory
        }

        // Brand filter
        if (filters.brand) {
            query.brand = { $in: filters.brand.split(",") }
        }

        // Price range filter
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            query.price = {}
            if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice
            if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice
        }

        // Rating filter
        if (filters.rating) {
            query.rating = { $gte: filters.rating }
        }

        // In stock filter
        if (filters.inStock) {
            query.stock = { $gt: 0 }
        }

        // Featured filter
        if (filters.featured) {
            query.featured = true
        }

        // Search text filter
        if (filters.search) {
            query.$text = { $search: filters.search }
        }

        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
            query.tags = { $in: filters.tags }
        }

        // Sorting
        let sort: Record<string, 1 | -1> = { createdAt: -1 }
        switch (filters.sort) {
            case "price_asc":
                sort = { price: 1 }
                break
            case "price_desc":
                sort = { price: -1 }
                break
            case "rating":
                sort = { rating: -1 }
                break
            case "newest":
                sort = { createdAt: -1 }
                break
            case "popular":
                sort = { sold: -1 }
                break
        }

        return this.findPaginated(query, { ...pagination, sort })
    }

    /**
     * Get featured products
     */
    async getFeatured(limit: number = 10): Promise<IProduct[]> {
        return this.model.find({ featured: true, isActive: true })
            .sort({ rating: -1 })
            .limit(limit)
            .lean<IProduct[]>()
    }

    /**
     * Get recommended products
     */
    async getRecommended(limit: number = 10): Promise<IProduct[]> {
        return this.model.find({ recommended: true, isActive: true })
            .sort({ sold: -1 })
            .limit(limit)
            .lean<IProduct[]>()
    }

    /**
     * Get products by category
     */
    async getByCategory(category: string, options = { page: 1, limit: 12 }): Promise<any> {
        return this.findPaginated(
            { category: { $regex: new RegExp(category, "i") }, isActive: true },
            { ...options, sort: { createdAt: -1 } }
        )
    }

    /**
     * Get products by seller
     */
    async getBySeller(sellerId: string, options = { page: 1, limit: 12 }): Promise<any> {
        return this.findPaginated(
            { seller: sellerId },
            { ...options, sort: { createdAt: -1 } }
        )
    }

    /**
     * Get similar products
     */
    async getSimilar(productId: string, limit: number = 6): Promise<IProduct[]> {
        const product = await this.findById(productId)
        if (!product) return []

        return this.model.find({
            _id: { $ne: productId },
            category: product.category,
            isActive: true
        })
            .sort({ rating: -1, sold: -1 })
            .limit(limit)
            .lean<IProduct[]>()
    }

    /**
     * Update product stock
     */
    async updateStock(productId: string, quantity: number): Promise<IProduct | null> {
        return this.model.findByIdAndUpdate(
            productId,
            { $inc: { stock: quantity } },
            { new: true }
        ).lean<IProduct>()
    }

    /**
     * Increment sold count
     */
    async incrementSold(productId: string, quantity: number): Promise<void> {
        await this.model.updateOne(
            { _id: productId },
            { $inc: { sold: quantity } }
        )
    }

    /**
     * Increment view count
     */
    async incrementViews(productId: string): Promise<void> {
        await this.model.updateOne(
            { _id: productId },
            { $inc: { views: 1 } }
        )
    }

    /**
     * Get low stock products
     */
    async getLowStock(threshold: number = 10): Promise<IProduct[]> {
        return this.model.find({
            stock: { $lte: threshold, $gt: 0 },
            isActive: true
        })
            .sort({ stock: 1 })
            .lean<IProduct[]>()
    }

    /**
     * Get out of stock products
     */
    async getOutOfStock(): Promise<IProduct[]> {
        return this.model.find({ stock: 0, isActive: true }).lean<IProduct[]>()
    }

    /**
     * Get trending products (by recent sales)
     */
    async getTrending(days: number = 7, limit: number = 10): Promise<IProduct[]> {
        // This would need order data to calculate truly trending products
        // For now, return by sold count
        return this.model.find({ isActive: true })
            .sort({ sold: -1, views: -1 })
            .limit(limit)
            .lean<IProduct[]>()
    }

    /**
     * Get product statistics for admin
     */
    async getStatistics(): Promise<{
        total: number
        active: number
        outOfStock: number
        lowStock: number
        totalValue: number
    }> {
        const [total, active, outOfStock, lowStock, valueResult] = await Promise.all([
            this.count(),
            this.count({ isActive: true }),
            this.count({ stock: 0 }),
            this.count({ stock: { $lte: 10, $gt: 0 } }),
            this.model.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: null, total: { $sum: { $multiply: ["$price", "$stock"] } } } }
            ])
        ])

        return {
            total,
            active,
            outOfStock,
            lowStock,
            totalValue: valueResult[0]?.total || 0
        }
    }
}

// Export singleton instance
export const productRepository = new ProductRepository()
