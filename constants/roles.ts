export const USER_ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
  CUSTOMER: 'customer',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'manage_users',
    'manage_products',
    'manage_orders',
    'manage_payments',
    'manage_inventory',
    'manage_coupons',
    'manage_analytics',
    'manage_settings',
    'manage_support',
    'manage_sellers',
  ],
  [USER_ROLES.SELLER]: [
    'manage_own_products',
    'manage_own_orders',
    'view_own_analytics',
    'manage_own_inventory',
  ],
  [USER_ROLES.CUSTOMER]: [
    'place_orders',
    'view_own_orders',
    'manage_own_profile',
    'create_support_tickets',
  ],
} as const

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const

export const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay',
  COD: 'cod',
  WALLET: 'wallet',
} as const