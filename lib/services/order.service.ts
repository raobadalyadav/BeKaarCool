/**
 * Order Service
 * Business logic for order operations
 */

import { orderRepository } from "@/lib/repositories"
import { productService } from "./product.service"
import { userRepository } from "@/lib/repositories"
import {
    IOrder,
    OrderStatus,
    PaymentStatus,
    IPaginationOptions,
    IPaginatedResponse,
    IOrderCreateDTO
} from "@/lib/types/entities"
import { ApiError, NotFoundError } from "@/lib/api/middleware"

class OrderService {
    private repository = orderRepository

    /**
     * Create a new order
     */
    async createOrder(
        userId: string,
        data: IOrderCreateDTO
    ): Promise<IOrder> {
        // Generate order number
        const orderNumber = await this.repository.generateOrderNumber()

        // Calculate totals
        let subtotal = 0
        const processedItems = []

        for (const item of data.items) {
            if (item.productId) {
                // Verify stock and get product
                const stockCheck = await productService.checkStock(item.productId, item.quantity)
                if (!stockCheck.available) {
                    throw new ApiError(
                        `Product is out of stock. Available: ${stockCheck.currentStock}`,
                        400
                    )
                }
            }

            const itemTotal = item.price * item.quantity
            subtotal += itemTotal

            processedItems.push({
                product: item.productId,
                quantity: item.quantity,
                price: item.price,
                size: item.size,
                color: item.color,
                customization: item.customization
            })
        }

        // Calculate shipping (free above ₹599)
        const shipping = subtotal >= 599 ? 0 : 49

        // Apply coupon discount if provided
        let discount = 0
        if (data.couponCode) {
            // TODO: Implement coupon validation
            discount = 0
        }

        const total = subtotal + shipping - discount

        // Create order data
        const orderData = {
            orderNumber,
            user: userId,
            customer: userId,
            items: processedItems,
            subtotal,
            shipping,
            discount,
            total,
            tax: 0,
            couponCode: data.couponCode,
            shippingAddress: data.shippingAddress,
            paymentMethod: data.paymentMethod,
            status: "pending" as const,
            paymentStatus: "pending" as const
        }

        // Create order
        const order = await this.repository.create(orderData as unknown as Partial<IOrder>)

        // Update product stock
        for (const item of data.items) {
            if (item.productId) {
                await productService.updateStockAfterOrder(item.productId, item.quantity)
            }
        }

        // Award loyalty points (1 point per ₹10 spent)
        const pointsEarned = Math.floor(total / 10)
        if (pointsEarned > 0) {
            await userRepository.addLoyaltyPoints(userId, pointsEarned)
        }

        return order
    }

    /**
     * Get order by ID
     */
    async getById(orderId: string): Promise<IOrder | null> {
        return this.repository.getFullDetails(orderId)
    }

    /**
     * Get order by order number
     */
    async getByOrderNumber(orderNumber: string): Promise<IOrder | null> {
        return this.repository.findByOrderNumber(orderNumber)
    }

    /**
     * Get user's orders
     */
    async getUserOrders(
        userId: string,
        options: IPaginationOptions
    ): Promise<IPaginatedResponse<IOrder>> {
        return this.repository.getByUser(userId, options)
    }

    /**
     * Get seller's orders
     */
    async getSellerOrders(
        sellerId: string,
        options: IPaginationOptions
    ): Promise<IPaginatedResponse<IOrder>> {
        return this.repository.getSellerOrders(sellerId, options)
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
        const order = await this.repository.findById(orderId)
        if (!order) {
            throw new NotFoundError("Order")
        }

        // Validate status transitions
        if (!this.isValidStatusTransition(order.status, status)) {
            throw new ApiError(
                `Cannot transition from ${order.status} to ${status}`,
                400
            )
        }

        return this.repository.updateStatus(orderId, status, additionalData)
    }

    /**
     * Cancel order
     */
    async cancelOrder(
        orderId: string,
        userId: string,
        reason: string
    ): Promise<IOrder | null> {
        const order = await this.repository.findById(orderId)
        if (!order) {
            throw new NotFoundError("Order")
        }

        // Verify ownership
        if (order.customer?.toString() !== userId) {
            throw new ApiError("You can only cancel your own orders", 403)
        }

        // Check if cancellable
        if (!["pending", "confirmed"].includes(order.status)) {
            throw new ApiError(
                "Order cannot be cancelled at this stage",
                400
            )
        }

        // Restore stock
        for (const item of order.items) {
            if (item.product) {
                await productService.restock(
                    item.product.toString(),
                    item.quantity
                )
            }
        }

        return this.repository.cancelOrder(orderId, reason)
    }

    /**
     * Update payment status
     */
    async updatePaymentStatus(
        orderId: string,
        paymentStatus: PaymentStatus,
        paymentId?: string
    ): Promise<IOrder | null> {
        const order = await this.repository.updatePaymentStatus(orderId, paymentStatus, paymentId)

        // If payment successful, confirm order
        if (paymentStatus === "paid" && order?.status === "pending") {
            return this.updateStatus(orderId, "confirmed")
        }

        return order
    }

    /**
     * Check if status transition is valid
     */
    private isValidStatusTransition(
        currentStatus: OrderStatus,
        newStatus: OrderStatus
    ): boolean {
        const validTransitions: Record<OrderStatus, OrderStatus[]> = {
            pending: ["confirmed", "cancelled"],
            confirmed: ["processing", "cancelled"],
            processing: ["shipped", "cancelled"],
            shipped: ["delivered"],
            delivered: [],
            cancelled: []
        }

        return validTransitions[currentStatus]?.includes(newStatus) || false
    }

    /**
     * Get order statistics
     */
    async getStatistics(): Promise<any> {
        return this.repository.getOrderStats()
    }

    /**
     * Get revenue statistics
     */
    async getRevenueStats(startDate: Date, endDate: Date): Promise<any> {
        return this.repository.getRevenueStats(startDate, endDate)
    }

    /**
     * Get top customers
     */
    async getTopCustomers(limit: number = 10): Promise<any> {
        return this.repository.getTopCustomers(limit)
    }

    /**
     * Calculate estimated delivery date
     */
    calculateEstimatedDelivery(pincode: string): Date {
        // Metro cities: 2-3 days
        // Other cities: 4-5 days
        // Remote areas: 6-7 days
        const metroPincodes = ["110001", "400001", "560001", "600001", "700001", "500001"]

        let daysToAdd = 5 // Default
        if (metroPincodes.some(p => pincode.startsWith(p.substring(0, 2)))) {
            daysToAdd = 3
        } else if (pincode.startsWith("7") || pincode.startsWith("8")) {
            daysToAdd = 7 // Remote areas
        }

        const date = new Date()
        date.setDate(date.getDate() + daysToAdd)
        return date
    }
}

// Export singleton instance
export const orderService = new OrderService()
