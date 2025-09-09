// Cart localStorage utilities
export const CART_STORAGE_KEY = 'bekaar-cool-cart'
export const COUPON_STORAGE_KEY = 'bekaar-cool-coupon'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  size?: string
  color?: string
}

export interface StoredCart {
  items: CartItem[]
  total: number
  subtotal: number
  shipping: number
  tax: number
  discount: number
  couponCode?: string
  updatedAt: number
}

export interface StoredCoupon {
  code: string
  discount: number
  discountType: 'percentage' | 'fixed'
  appliedAt: number
}

// Cart functions
export const getStoredCart = (): StoredCart | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export const setStoredCart = (cart: StoredCart): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
      ...cart,
      updatedAt: Date.now()
    }))
  } catch (error) {
    console.error('Failed to store cart:', error)
  }
}

export const clearStoredCart = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_STORAGE_KEY)
}

// Coupon functions
export const getStoredCoupon = (): StoredCoupon | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(COUPON_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export const setStoredCoupon = (coupon: StoredCoupon): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify({
      ...coupon,
      appliedAt: Date.now()
    }))
  } catch (error) {
    console.error('Failed to store coupon:', error)
  }
}

export const clearStoredCoupon = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(COUPON_STORAGE_KEY)
}

// Sync functions
export const syncCartWithStorage = (serverCart: any): StoredCart => {
  const storedCart = getStoredCart()
  
  // If no stored cart or server cart is newer, use server cart
  if (!storedCart || (serverCart.updatedAt && new Date(serverCart.updatedAt).getTime() > storedCart.updatedAt)) {
    const newCart: StoredCart = {
      items: serverCart.items || [],
      total: serverCart.total || 0,
      subtotal: serverCart.subtotal || 0,
      shipping: serverCart.shipping || 0,
      tax: serverCart.tax || 0,
      discount: serverCart.discount || 0,
      couponCode: serverCart.couponCode,
      updatedAt: Date.now()
    }
    setStoredCart(newCart)
    return newCart
  }
  
  return storedCart
}