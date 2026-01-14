/**
 * Product Service
 * Business logic for product operations
 */

import { BaseService } from "./base.service"
import { productRepository } from "@/lib/repositories"
import { IProduct, IProductFilters, IPaginationOptions, IPaginatedResponse } from "@/lib/types/entities"
import { ProductCreateInput, ProductUpdateInput } from "@/lib/validations/schemas"

class ProductService {
    private repository = productRepository

    /**
     * Get product by ID with view increment
     */
    async getById(id: string, incrementView: boolean = true): Promise<IProduct | null> {
        const product = await this.repository.findById(id)
        if (product && incrementView) {
            await this.repository.incrementViews(id)
        }
        return product
    }

    /**
     * Get product by slug
     */
    async getBySlug(slug: string): Promise<IProduct | null> {
        return this.repository.findBySlug(slug)
    }

    /**
     * Get product with reviews
     */
    async getWithReviews(id: string): Promise<IProduct | null> {
        return this.repository.findByIdWithReviews(id)
    }

    /**
     * Search products with filters
     */
    async search(
        filters: IProductFilters,
        pagination: IPaginationOptions
    ): Promise<IPaginatedResponse<IProduct>> {
        return this.repository.searchWithFilters(filters, pagination)
    }

    /**
     * Get featured products for homepage
     */
    async getFeatured(limit: number = 10): Promise<IProduct[]> {
        return this.repository.getFeatured(limit)
    }

    /**
     * Get recommended products
     */
    async getRecommended(limit: number = 10): Promise<IProduct[]> {
        return this.repository.getRecommended(limit)
    }

    /**
     * Get products by category
     */
    async getByCategory(
        category: string,
        options: IPaginationOptions
    ): Promise<IPaginatedResponse<IProduct>> {
        return this.repository.getByCategory(category, options)
    }

    /**
     * Get seller's products
     */
    async getSellerProducts(
        sellerId: string,
        options: IPaginationOptions
    ): Promise<IPaginatedResponse<IProduct>> {
        return this.repository.getBySeller(sellerId, options)
    }

    /**
     * Get similar products
     */
    async getSimilar(productId: string, limit: number = 6): Promise<IProduct[]> {
        return this.repository.getSimilar(productId, limit)
    }

    /**
     * Create a new product (seller only)
     */
    async create(sellerId: string, data: ProductCreateInput): Promise<IProduct> {
        const productData = {
            ...data,
            seller: sellerId
        }
        return this.repository.create(productData as unknown as Partial<IProduct>)
    }

    /**
     * Update product (owner only)
     */
    async update(
        productId: string,
        sellerId: string,
        data: ProductUpdateInput
    ): Promise<IProduct | null> {
        // Verify ownership
        const product = await this.repository.findById(productId)
        if (!product || product.seller?.toString() !== sellerId) {
            return null
        }
        return this.repository.updateById(productId, data as any)
    }

    /**
     * Delete product (soft delete)
     */
    async delete(productId: string, sellerId: string): Promise<boolean> {
        const product = await this.repository.findById(productId)
        if (!product || product.seller?.toString() !== sellerId) {
            return false
        }
        await this.repository.softDelete(productId)
        return true
    }

    /**
     * Update stock after order
     */
    async updateStockAfterOrder(
        productId: string,
        quantity: number
    ): Promise<IProduct | null> {
        const product = await this.repository.updateStock(productId, -quantity)
        if (product) {
            await this.repository.incrementSold(productId, quantity)
        }
        return product
    }

    /**
     * Restock product
     */
    async restock(productId: string, quantity: number): Promise<IProduct | null> {
        return this.repository.updateStock(productId, quantity)
    }

    /**
     * Get inventory alerts
     */
    async getInventoryAlerts(): Promise<{
        lowStock: IProduct[]
        outOfStock: IProduct[]
    }> {
        const [lowStock, outOfStock] = await Promise.all([
            this.repository.getLowStock(10),
            this.repository.getOutOfStock()
        ])
        return { lowStock, outOfStock }
    }

    /**
     * Get product statistics
     */
    async getStatistics(): Promise<{
        total: number
        active: number
        outOfStock: number
        lowStock: number
        totalValue: number
    }> {
        return this.repository.getStatistics()
    }

    /**
     * Get trending products
     */
    async getTrending(limit: number = 10): Promise<IProduct[]> {
        return this.repository.getTrending(7, limit)
    }

    /**
     * Check stock availability
     */
    async checkStock(productId: string, quantity: number): Promise<{
        available: boolean
        currentStock: number
    }> {
        const product = await this.repository.findById(productId)
        if (!product) {
            return { available: false, currentStock: 0 }
        }
        return {
            available: product.stock >= quantity,
            currentStock: product.stock
        }
    }

    /**
     * Calculate discount percentage
     */
    calculateDiscount(price: number, originalPrice?: number): number {
        if (!originalPrice || originalPrice <= price) return 0
        return Math.round(((originalPrice - price) / originalPrice) * 100)
    }

    /**
     * Get category list with product counts
     */
    async getCategoryStats(): Promise<Array<{ category: string; count: number }>> {
        return this.repository.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $project: { category: "$_id", count: 1, _id: 0 } },
            { $sort: { count: -1 } }
        ])
    }

    /**
     * Get brand list with product counts
     */
    async getBrandStats(): Promise<Array<{ brand: string; count: number }>> {
        return this.repository.aggregate([
            { $match: { isActive: true, brand: { $exists: true, $ne: "" } } },
            { $group: { _id: "$brand", count: { $sum: 1 } } },
            { $project: { brand: "$_id", count: 1, _id: 0 } },
            { $sort: { count: -1 } }
        ])
    }
}

// Export singleton instance
export const productService = new ProductService()
