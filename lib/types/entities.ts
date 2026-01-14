/**
 * Core Entity Interfaces
 * These interfaces define the shape of all database documents
 * Used across the application for type safety
 */

import { Types } from "mongoose"

// ============================================
// BASE INTERFACES
// ============================================

export interface IBaseEntity {
    _id?: Types.ObjectId | string
    createdAt?: Date
    updatedAt?: Date
}

export interface ITimestamps {
    createdAt?: Date
    updatedAt?: Date
}

// ============================================
// USER ENTITIES
// ============================================

export type UserRole = "customer" | "seller" | "admin"
export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum"
export type ThemePreference = "light" | "dark"

export interface IAddress {
    _id?: Types.ObjectId | string
    name: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
    country: string
    isDefault?: boolean
    type?: "home" | "work" | "other"
}

export interface IUserPreferences {
    language: string
    currency: string
    newsletter: boolean
    notifications: boolean
    theme: ThemePreference
}

export interface IUser extends IBaseEntity {
    name: string
    email: string
    password?: string // select: false in schema
    avatar?: string
    phone?: string
    role: UserRole
    isVerified: boolean
    isActive: boolean
    addresses: IAddress[]
    wishlist: Types.ObjectId[] | IProduct[]
    preferences: IUserPreferences
    loyaltyPoints: number
    loyaltyTier: LoyaltyTier
    affiliateCode?: string
    referredBy?: Types.ObjectId | string
    lastLogin?: Date
    // Security tokens (should never be exposed to client)
    resetPasswordToken?: string
    resetPasswordExpires?: Date
    emailVerificationToken?: string
    emailVerificationExpires?: Date
}

export interface IUserCreateDTO {
    name: string
    email: string
    password: string
    phone?: string
    role?: UserRole
}

export interface IUserUpdateDTO {
    name?: string
    phone?: string
    avatar?: string
    preferences?: Partial<IUserPreferences>
}

// ============================================
// PRODUCT ENTITIES
// ============================================

export interface IProductVariations {
    sizes: string[]
    colors: string[]
    priceModifiers?: Map<string, number>
}

export interface IProductSEO {
    title?: string
    description?: string
    keywords?: string[]
}

export interface IProduct extends IBaseEntity {
    name: string
    slug: string
    description: string
    price: number
    originalPrice?: number
    images: string[]
    videos?: string[]
    category: string
    subcategory?: string
    brand?: string
    tags: string[]
    variations: IProductVariations
    stock: number
    sold: number
    rating: number
    reviews: Types.ObjectId[] | IReview[]
    featured: boolean
    recommended: boolean
    isActive: boolean
    seller: Types.ObjectId | IUser
    sku?: string
    views: number
    customizable: boolean
    qrCode?: string
    seo: IProductSEO
}

export interface IProductCreateDTO {
    name: string
    description: string
    price: number
    originalPrice?: number
    images: string[]
    category: string
    subcategory?: string
    brand?: string
    tags?: string[]
    variations?: Partial<IProductVariations>
    stock: number
    seller: string
}

export interface IProductUpdateDTO extends Partial<IProductCreateDTO> {
    featured?: boolean
    recommended?: boolean
    isActive?: boolean
}

export interface IProductFilters {
    category?: string
    subcategory?: string
    brand?: string
    minPrice?: number
    maxPrice?: number
    rating?: number
    inStock?: boolean
    featured?: boolean
    search?: string
    tags?: string[]
    sort?: "price_asc" | "price_desc" | "rating" | "newest" | "popular"
}

// ============================================
// ORDER ENTITIES
// ============================================

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"
export type PaymentMethod = "razorpay" | "cod" | "upi" | "card" | "netbanking" | "wallet"

export interface IOrderItem {
    product?: Types.ObjectId | IProduct
    customProduct?: {
        name: string
        type: string
        basePrice: number
    }
    quantity: number
    price: number
    size?: string
    color?: string
    customization?: {
        design?: string
        text?: string
        position?: { x: number; y: number }
        font?: string
        textColor?: string
        elements?: any[]
    }
}

export interface IShippingAddress {
    name: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
    country: string
}

export interface IOrder extends IBaseEntity {
    orderNumber: string
    user: Types.ObjectId | IUser
    customer: Types.ObjectId | IUser
    items: IOrderItem[]
    total: number
    subtotal: number
    shipping: number
    tax: number
    discount: number
    couponCode?: string
    status: OrderStatus
    paymentStatus: PaymentStatus
    paymentMethod: PaymentMethod
    paymentId?: string
    shippingAddress: IShippingAddress
    billingAddress?: IShippingAddress
    trackingNumber?: string
    estimatedDelivery?: Date
    deliveredAt?: Date
    cancelledAt?: Date
    cancellationReason?: string
    refundedAt?: Date
    refundAmount?: number
    refundReason?: string
    notes?: string
    affiliateCode?: string
    affiliateCommission: number
}

export interface IOrderCreateDTO {
    items: Array<{
        productId?: string
        quantity: number
        price: number
        size?: string
        color?: string
        customization?: any
    }>
    shippingAddress: IShippingAddress
    paymentMethod: PaymentMethod
    couponCode?: string
}

// ============================================
// CART ENTITIES
// ============================================

export interface ICartItem {
    product?: Types.ObjectId | IProduct
    customProduct?: {
        name: string
        type: string
        basePrice: number
    }
    quantity: number
    size: string
    color: string
    customization?: any
    addedAt: Date
}

export interface ICart extends IBaseEntity {
    user: Types.ObjectId | IUser
    items: ICartItem[]
    couponCode?: string
    discount: number
}

// ============================================
// REVIEW ENTITIES
// ============================================

export interface IReview extends IBaseEntity {
    user: Types.ObjectId | IUser
    product: Types.ObjectId | IProduct
    rating: number
    title?: string
    comment: string
    images?: string[]
    isVerified: boolean
    helpfulCount: number
    reportCount: number
}

// ============================================
// COUPON ENTITIES
// ============================================

export type DiscountType = "percentage" | "fixed"

export interface ICoupon extends IBaseEntity {
    code: string
    description?: string
    discountType: DiscountType
    discountValue: number
    minOrderAmount: number
    maxDiscount?: number
    usageLimit?: number
    usedCount: number
    validFrom: Date
    validUntil: Date
    isActive: boolean
    applicableCategories?: string[]
    applicableProducts?: Types.ObjectId[]
}

// ============================================
// SUPPORT TICKET ENTITIES
// ============================================

export type TicketStatus = "open" | "in-progress" | "resolved" | "closed"
export type TicketPriority = "low" | "medium" | "high" | "urgent"

export interface ITicketMessage {
    sender: Types.ObjectId | IUser
    message: string
    attachments?: string[]
    sentAt: Date
}

export interface ISupportTicket extends IBaseEntity {
    ticketNumber: string
    user: Types.ObjectId | IUser
    subject: string
    category: string
    priority: TicketPriority
    status: TicketStatus
    order?: Types.ObjectId | IOrder
    messages: ITicketMessage[]
    assignedTo?: Types.ObjectId | IUser
    resolvedAt?: Date
}

// ============================================
// BANNER/CMS ENTITIES
// ============================================

export interface IBanner extends IBaseEntity {
    title: string
    subtitle?: string
    image: string
    mobileImage?: string
    link?: string
    position: number
    isActive: boolean
    startDate?: Date
    endDate?: Date
    type: "hero" | "promo" | "category" | "sale"
}

// ============================================
// PAGINATION & RESPONSE TYPES
// ============================================

export interface IPaginationOptions {
    page: number
    limit: number
    sort?: Record<string, 1 | -1>
}

export interface IPaginatedResponse<T> {
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
        hasNext: boolean
        hasPrev: boolean
    }
}

export interface IApiResponse<T = any> {
    success: boolean
    data?: T
    message?: string
    error?: string
    errors?: Record<string, string[]>
}
