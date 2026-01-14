/**
 * Zod Validation Schemas
 * Centralized input validation for all API endpoints
 * Provides runtime type checking and sanitization
 */

import { z } from "zod"

// ============================================
// COMMON SCHEMAS
// ============================================

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format")

export const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    sort: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional().default("desc")
})

export const phoneSchema = z.string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number")
    .optional()

export const pincodeSchema = z.string()
    .regex(/^\d{6}$/, "Pincode must be 6 digits")

export const emailSchema = z.string()
    .email("Invalid email address")
    .toLowerCase()
    .trim()

// ============================================
// ADDRESS SCHEMAS
// ============================================

export const addressSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
    address: z.string().min(10, "Address must be at least 10 characters").max(500),
    city: z.string().min(2, "City must be at least 2 characters").max(100),
    state: z.string().min(2, "State must be at least 2 characters").max(100),
    pincode: pincodeSchema,
    country: z.string().default("India"),
    type: z.enum(["home", "work", "other"]).optional(),
    isDefault: z.boolean().optional()
})

// ============================================
// USER SCHEMAS
// ============================================

export const userRegisterSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name cannot exceed 100 characters")
        .trim(),
    email: emailSchema,
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    phone: phoneSchema,
    role: z.enum(["customer", "seller"]).optional().default("customer")
})

export const userLoginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required")
})

export const userUpdateSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    phone: phoneSchema,
    avatar: z.string().url().optional()
})

export const userPreferencesSchema = z.object({
    language: z.string().default("en"),
    currency: z.string().default("INR"),
    newsletter: z.boolean().default(true),
    notifications: z.boolean().default(true),
    theme: z.enum(["light", "dark"]).default("light")
})

export const forgotPasswordSchema = z.object({
    email: emailSchema
})

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain uppercase")
        .regex(/[0-9]/, "Password must contain a number")
})

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain uppercase")
        .regex(/[0-9]/, "Password must contain a number")
})

// ============================================
// PRODUCT SCHEMAS
// ============================================

export const productVariationsSchema = z.object({
    sizes: z.array(z.string()).default([]),
    colors: z.array(z.string()).default([])
})

export const productCreateSchema = z.object({
    name: z.string()
        .min(3, "Product name must be at least 3 characters")
        .max(200, "Product name cannot exceed 200 characters")
        .trim(),
    description: z.string()
        .min(20, "Description must be at least 20 characters")
        .max(5000, "Description cannot exceed 5000 characters"),
    price: z.coerce.number()
        .min(1, "Price must be at least ₹1")
        .max(1000000, "Price cannot exceed ₹10,00,000"),
    originalPrice: z.coerce.number().min(0).optional(),
    images: z.array(z.string().url()).min(1, "At least one image is required").max(10),
    category: z.string().min(1, "Category is required"),
    subcategory: z.string().optional(),
    brand: z.string().optional(),
    tags: z.array(z.string()).default([]),
    variations: productVariationsSchema.optional(),
    stock: z.coerce.number().min(0, "Stock cannot be negative").default(0)
})

export const productUpdateSchema = productCreateSchema.partial().extend({
    featured: z.boolean().optional(),
    recommended: z.boolean().optional(),
    isActive: z.boolean().optional()
})

export const productFiltersSchema = z.object({
    category: z.string().optional(),
    subcategory: z.string().optional(),
    brand: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().max(1000000).optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    inStock: z.coerce.boolean().optional(),
    featured: z.coerce.boolean().optional(),
    search: z.string().max(200).optional(),
    sort: z.enum(["price_asc", "price_desc", "rating", "newest", "popular"]).optional()
}).merge(paginationSchema)

// ============================================
// CART SCHEMAS
// ============================================

export const addToCartSchema = z.object({
    productId: objectIdSchema.optional(),
    quantity: z.coerce.number().min(1).max(10).default(1),
    size: z.string().min(1, "Size is required"),
    color: z.string().min(1, "Color is required"),
    customization: z.any().optional(),
    // For custom products
    productType: z.string().optional(),
    productName: z.string().optional(),
    basePrice: z.coerce.number().min(0).optional()
}).refine(
    (data) => data.productId || (data.productType && data.productName && data.basePrice),
    { message: "Either productId or custom product details are required" }
)

export const updateCartItemSchema = z.object({
    quantity: z.coerce.number().min(1).max(10)
})

// ============================================
// ORDER SCHEMAS
// ============================================

export const orderItemSchema = z.object({
    productId: objectIdSchema.optional(),
    quantity: z.coerce.number().min(1),
    price: z.coerce.number().min(0),
    size: z.string().optional(),
    color: z.string().optional(),
    customization: z.any().optional()
})

export const createOrderSchema = z.object({
    items: z.array(orderItemSchema).min(1, "At least one item is required"),
    shippingAddress: addressSchema,
    paymentMethod: z.enum(["razorpay", "cod", "upi", "card"]),
    couponCode: z.string().optional()
})

export const updateOrderStatusSchema = z.object({
    status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
    trackingNumber: z.string().optional(),
    notes: z.string().max(500).optional()
})

export const cancelOrderSchema = z.object({
    reason: z.string()
        .min(10, "Please provide a reason (at least 10 characters)")
        .max(500, "Reason cannot exceed 500 characters")
})

// ============================================
// REVIEW SCHEMAS
// ============================================

export const createReviewSchema = z.object({
    productId: objectIdSchema,
    rating: z.coerce.number().min(1).max(5),
    title: z.string().max(100).optional(),
    comment: z.string()
        .min(10, "Review must be at least 10 characters")
        .max(1000, "Review cannot exceed 1000 characters"),
    images: z.array(z.string().url()).max(5).optional()
})

// ============================================
// COUPON SCHEMAS
// ============================================

export const createCouponSchema = z.object({
    code: z.string()
        .min(3, "Code must be at least 3 characters")
        .max(20, "Code cannot exceed 20 characters")
        .toUpperCase()
        .trim(),
    description: z.string().max(200).optional(),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.coerce.number().min(1),
    minOrderAmount: z.coerce.number().min(0).default(0),
    maxDiscount: z.coerce.number().min(0).optional(),
    usageLimit: z.coerce.number().min(1).optional(),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),
    applicableCategories: z.array(z.string()).optional(),
    applicableProducts: z.array(objectIdSchema).optional()
}).refine(
    (data) => data.validUntil > data.validFrom,
    { message: "End date must be after start date" }
).refine(
    (data) => data.discountType !== "percentage" || data.discountValue <= 100,
    { message: "Percentage discount cannot exceed 100%" }
)

export const applyCouponSchema = z.object({
    code: z.string().min(1, "Coupon code is required").toUpperCase().trim()
})

// ============================================
// SUPPORT TICKET SCHEMAS
// ============================================

export const createTicketSchema = z.object({
    subject: z.string()
        .min(5, "Subject must be at least 5 characters")
        .max(200, "Subject cannot exceed 200 characters"),
    category: z.enum(["order", "payment", "product", "shipping", "refund", "other"]),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    message: z.string()
        .min(20, "Message must be at least 20 characters")
        .max(2000, "Message cannot exceed 2000 characters"),
    orderId: objectIdSchema.optional(),
    attachments: z.array(z.string().url()).max(5).optional()
})

export const ticketReplySchema = z.object({
    message: z.string()
        .min(1, "Message is required")
        .max(2000, "Message cannot exceed 2000 characters"),
    attachments: z.array(z.string().url()).max(5).optional()
})

// ============================================
// WISHLIST SCHEMAS
// ============================================

export const wishlistAddSchema = z.object({
    productId: objectIdSchema
})

// ============================================
// BANNER SCHEMAS
// ============================================

export const bannerSchema = z.object({
    title: z.string().min(2).max(100),
    subtitle: z.string().max(200).optional(),
    image: z.string().url(),
    mobileImage: z.string().url().optional(),
    link: z.string().url().optional(),
    position: z.coerce.number().min(0).default(0),
    isActive: z.boolean().default(true),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    type: z.enum(["hero", "promo", "category", "sale"]).default("hero")
})

// ============================================
// HELPER TYPES
// ============================================

export type UserRegisterInput = z.infer<typeof userRegisterSchema>
export type UserLoginInput = z.infer<typeof userLoginSchema>
export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
export type ProductFiltersInput = z.infer<typeof productFiltersSchema>
export type AddToCartInput = z.infer<typeof addToCartSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type CreateCouponInput = z.infer<typeof createCouponSchema>
export type CreateTicketInput = z.infer<typeof createTicketSchema>
