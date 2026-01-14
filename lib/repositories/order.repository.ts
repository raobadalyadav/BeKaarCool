/**
 * Order Repository
 * Data access layer for Order model
 */

import { BaseRepository } from "./base.repository"
import { Order } from "@/models/Order"
import { IOrder, OrderStatus, PaymentStatus, IPaginationOptions } from "@/lib/types/entities"
import { FilterQuery } from "mongoose"

class OrderRepository extends BaseRepository<IOrder> {
    constructor() {
        super(Order)
    }

    /**
     * Generate unique order number
     */
    async generateOrderNumber(): Promise<string> {
        const date = new Date()
        const prefix = `BKC${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`
        const count = await this.count({
            createdAt: {
                $gte: new Date(date.getFullYear(), date.getMonth(), 1),
                $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
            }
        })
        return `${prefix}${String(count + 1).padStart(5, "0")}`
    }

    /**
     * Find order by order number
     */
    async findByOrderNumber(orderNumber: string): Promise<IOrder | null> {
        return this.model.findOne({ orderNumber })
            .populate("customer", "name email phone")
            .populate("items.product", "name images price")
            .lean<IOrder>()
    }

    /**
     * Get orders by user
     */
    async getByUser(userId: string, options: IPaginationOptions): Promise<any> {
        return this.findPaginated(
            { customer: userId },
            { ...options, sort: { createdAt: -1 } }
        )
    }

    /**
     * Get orders by status
     */
    async getByStatus(status: OrderStatus, options: IPaginationOptions): Promise<any> {
        return this.findPaginated({ status }, options)
    }

    /**
     * Get pending orders
     */
    async getPending(options: IPaginationOptions): Promise<any> {
        return this.findPaginated(
            { status: { $in: ["pending", "confirmed", "processing"] } },
            options
        )
    }

    /**
     * Update order status
     */
    async updateStatus(
        orderId: string,
        status: OrderStatus,
        additionalData?: {
            trackingNumber?: string
            notes?: string
            cancellationReason?: string
        }
    ): Promise<IOrder | null> {
        const updateData: any = { status }

        if (status === "delivered") {
            updateData.deliveredAt = new Date()
        } else if (status === "cancelled") {
            updateData.cancelledAt = new Date()
            if (additionalData?.cancellationReason) {
                updateData.cancellationReason = additionalData.cancellationReason
            }
        }

        if (additionalData?.trackingNumber) {
            updateData.trackingNumber = additionalData.trackingNumber
        }

        if (additionalData?.notes) {
            updateData.notes = additionalData.notes
        }

        return this.updateById(orderId, updateData)
    }

    /**
     * Update payment status
     */
    async updatePaymentStatus(
        orderId: string,
        paymentStatus: PaymentStatus,
        paymentId?: string
    ): Promise<IOrder | null> {
        const updateData: any = { paymentStatus }
        if (paymentId) updateData.paymentId = paymentId
        if (paymentStatus === "refunded") updateData.refundedAt = new Date()

        return this.updateById(orderId, updateData)
    }

    /**
     * Cancel order
     */
    async cancelOrder(orderId: string, reason: string): Promise<IOrder | null> {
        return this.updateStatus(orderId, "cancelled", { cancellationReason: reason })
    }

    /**
     * Get order with full details
     */
    async getFullDetails(orderId: string): Promise<IOrder | null> {
        if (!this.isValidObjectId(orderId)) return null

        return this.model.findById(orderId)
            .populate("customer", "name email phone addresses")
            .populate("user", "name email")
            .populate({
                path: "items.product",
                select: "name images price category brand seller",
                populate: { path: "seller", select: "name email" }
            })
            .lean<IOrder>()
    }

    /**
     * Get seller orders
     */
    async getSellerOrders(sellerId: string, options: IPaginationOptions): Promise<any> {
        // Orders where at least one item belongs to this seller
        return this.findPaginated(
            { user: sellerId },
            { ...options, sort: { createdAt: -1 } }
        )
    }

    /**
     * Get revenue statistics
     */
    async getRevenueStats(startDate: Date, endDate: Date): Promise<{
        totalRevenue: number
        orderCount: number
        averageOrderValue: number
        dailyRevenue: Array<{ date: string; revenue: number; orders: number }>
    }> {
        const result = await this.model.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    paymentStatus: "paid"
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$total" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ])

        const totalRevenue = result.reduce((sum, day) => sum + day.revenue, 0)
        const orderCount = result.reduce((sum, day) => sum + day.orders, 0)

        return {
            totalRevenue,
            orderCount,
            averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
            dailyRevenue: result.map(day => ({
                date: day._id,
                revenue: day.revenue,
                orders: day.orders
            }))
        }
    }

    /**
     * Get order statistics
     */
    async getOrderStats(): Promise<{
        total: number
        pending: number
        processing: number
        shipped: number
        delivered: number
        cancelled: number
        todayOrders: number
        todayRevenue: number
    }> {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [total, pending, processing, shipped, delivered, cancelled, todayStats] = await Promise.all([
            this.count(),
            this.count({ status: "pending" }),
            this.count({ status: "processing" }),
            this.count({ status: "shipped" }),
            this.count({ status: "delivered" }),
            this.count({ status: "cancelled" }),
            this.model.aggregate([
                { $match: { createdAt: { $gte: today } } },
                { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$total" } } }
            ])
        ])

        return {
            total,
            pending,
            processing,
            shipped,
            delivered,
            cancelled,
            todayOrders: todayStats[0]?.count || 0,
            todayRevenue: todayStats[0]?.revenue || 0
        }
    }

    /**
     * Get top customers
     */
    async getTopCustomers(limit: number = 10): Promise<Array<{
        customer: any
        orderCount: number
        totalSpent: number
    }>> {
        return this.model.aggregate([
            { $match: { paymentStatus: "paid" } },
            {
                $group: {
                    _id: "$customer",
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: "$total" }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
            {
                $project: {
                    customer: { name: 1, email: 1, avatar: 1 },
                    orderCount: 1,
                    totalSpent: 1
                }
            }
        ])
    }
}

// Export singleton instance
export const orderRepository = new OrderRepository()
