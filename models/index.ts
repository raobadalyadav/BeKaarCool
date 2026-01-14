/**
 * Models Index
 * Central export for all database models
 */

// ============================================
// Core Models & Interfaces
// ============================================

// User
export { User } from "./User"
export type { IUserDocument } from "./User"

// Product
export { Product } from "./Product"
export type { IProduct, IProductVariation, IProductSEO } from "./Product"

// Order
export { Order } from "./Order"
export type { IOrder, IOrderItem, IShippingAddress, OrderStatus, PaymentStatus, PaymentMethod } from "./Order"

// Cart
export { Cart } from "./Cart"
export type { ICart, ICartItem } from "./Cart"

// Review
export { Review } from "./Review"
export type { IReview } from "./Review"

// Coupon
export { Coupon } from "./Coupon"
export type { ICoupon } from "./Coupon"

// ============================================
// Category & Organization
// ============================================

export { Category } from "./Category"
export type { ICategory } from "./Category"

export { Banner } from "./Banner"
export type { IBanner } from "./Banner"

// ============================================
// User Related
// ============================================

export { Address } from "./Address"
export type { IAddress } from "./Address"

export { WishlistItem } from "./Wishlist"
export type { IWishlistItem } from "./Wishlist"

export { Session } from "./Session"
export type { ISession } from "./Session"

export { Notification } from "./Notification"
export type { INotification } from "./Notification"

// ============================================
// Inventory
// ============================================

export { Inventory, InventoryMovement } from "./Inventory"
export type { IInventory, IInventoryMovement } from "./Inventory"

// ============================================
// Transactions & Payments
// ============================================

export { Transaction } from "./Transaction"
export type { ITransaction } from "./Transaction"

// ============================================
// Shipping & Returns
// ============================================

export { Shipment } from "./Shipment"
export type { IShipment } from "./Shipment"

export { ReturnRequest } from "./ReturnRequest"
export type { IReturnRequest } from "./ReturnRequest"

// ============================================
// Support
// ============================================

export { SupportTicket } from "./SupportTicket"
export type { ISupportTicket, ITicketMessage, TicketCategory, TicketPriority, TicketStatus } from "./SupportTicket"

// ============================================
// Referral & Loyalty
// ============================================

export { Referral } from "./Referral"
export type { IReferral } from "./Referral"

// ============================================
// Logging & Audit
// ============================================

export { ActivityLog } from "./ActivityLog"
export type { IActivityLog } from "./ActivityLog"
