import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { getStoredCart, setStoredCart, clearStoredCart, getStoredCoupon, setStoredCoupon, clearStoredCoupon } from "@/lib/localStorage"

interface CartItem {
  id: string
  productId: string | null
  name: string
  price: number
  originalPrice?: number
  image: string
  quantity: number
  size: string
  color: string
  stock: number
  customization?: {
    design?: string
    text?: string
    position?: { x: number; y: number }
    elements?: any[]
  }
  seller: {
    id: string
    name: string
  }
  customProduct?: {
    type: string
    name: string
    basePrice: number
  }
}

interface CartState {
  items: CartItem[]
  total: number
  subtotal: number
  shipping: number
  tax: number
  discount: number
  couponCode?: string
  loading: boolean
  error: string | null
}

const initialState: CartState = {
  items: [],
  total: 0,
  subtotal: 0,
  shipping: 0,
  tax: 0,
  discount: 0,
  loading: false,
  error: null,
}

const transformCartItem = (item: any): CartItem => ({
  id: item._id,
  productId: item.product?._id || null,
  name: item.product?.name || item.customProduct?.name || 'Custom Product',
  price: item.product?.price || item.price,
  originalPrice: item.product?.originalPrice,
  image: item.product?.images?.[0] || "/placeholder.svg",
  quantity: item.quantity,
  size: item.size,
  color: item.color,
  customization: item.customization,
  seller: item.product?.seller ? {
    id: item.product.seller._id,
    name: item.product.seller.name,
  } : { id: 'custom', name: 'Custom Design' },
  stock: item.product?.stock || 999,
  customProduct: item.customProduct,
})

export const fetchCart = createAsyncThunk("cart/fetchCart", async () => {
  const response = await fetch("/api/cart")
  if (!response.ok) throw new Error("Failed to fetch cart")
  const data = await response.json()
  
  return {
    ...data,
    items: data.items.map(transformCartItem),
  }
})

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (item: {
    productId?: string
    quantity: number
    size: string
    color: string
    customization?: any
    productType?: string
    productName?: string
    basePrice?: number
  }) => {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to add to cart")
    }
    const data = await response.json()
    
    return {
      ...data,
      items: data.items.map(transformCartItem),
    }
  },
)

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
    const response = await fetch(`/api/cart/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    })
    if (!response.ok) throw new Error("Failed to update cart item")
    const data = await response.json()
    
    return {
      ...data,
      items: data.items.map(transformCartItem),
    }
  },
)

export const removeFromCart = createAsyncThunk("cart/removeFromCart", async (itemId: string) => {
  const response = await fetch(`/api/cart/${itemId}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to remove from cart")
  const data = await response.json()
  
  return {
    ...data,
    items: data.items.map(transformCartItem),
  }
})

export const applyCoupon = createAsyncThunk("cart/applyCoupon", async (couponCode: string) => {
  const response = await fetch("/api/cart/coupon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: couponCode }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Invalid coupon code")
  }
  return response.json()
})

export const removeCoupon = createAsyncThunk("cart/removeCoupon", async () => {
  const response = await fetch("/api/cart/coupon", {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error("Failed to remove coupon")
  }
  return response.json()
})

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = []
      state.total = 0
      state.subtotal = 0
      state.discount = 0
      state.couponCode = undefined
      clearStoredCart()
      clearStoredCoupon()
    },
    loadFromStorage: (state) => {
      const storedCart = getStoredCart()
      const storedCoupon = getStoredCoupon()
      
      if (storedCart) {
        state.items = storedCart.items
        state.total = storedCart.total
        state.subtotal = storedCart.subtotal
        state.shipping = storedCart.shipping
        state.tax = storedCart.tax
        state.discount = storedCart.discount
        state.couponCode = storedCart.couponCode
      }
      
      if (storedCoupon) {
        state.couponCode = storedCoupon.code
        state.discount = storedCoupon.discount
      }
    },
    calculateTotals: (state) => {
      state.subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      state.tax = state.subtotal * 0.18 // 18% GST
      state.shipping = state.subtotal > 999 ? 0 : 99
      state.total = state.subtotal + state.tax + state.shipping - state.discount
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.total = action.payload.total
        state.subtotal = action.payload.subtotal
        state.shipping = action.payload.shipping
        state.tax = action.payload.tax
        state.couponCode = action.payload.couponCode
        state.discount = action.payload.discount
        
        // Store in localStorage
        setStoredCart({
          items: action.payload.items,
          total: action.payload.total,
          subtotal: action.payload.subtotal,
          shipping: action.payload.shipping,
          tax: action.payload.tax,
          discount: action.payload.discount,
          couponCode: action.payload.couponCode,
          updatedAt: Date.now()
        })
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch cart"
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.items
        state.total = action.payload.total
        state.subtotal = action.payload.subtotal
        state.shipping = action.payload.shipping
        state.tax = action.payload.tax
        state.discount = action.payload.discount
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload.items
        state.total = action.payload.total
        state.subtotal = action.payload.subtotal
        state.shipping = action.payload.shipping
        state.tax = action.payload.tax
        state.discount = action.payload.discount
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload.items
        state.total = action.payload.total
        state.subtotal = action.payload.subtotal
        state.shipping = action.payload.shipping
        state.tax = action.payload.tax
        state.discount = action.payload.discount
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.discount = action.payload.discount
        state.couponCode = action.payload.couponCode
        
        // Store coupon in localStorage
        setStoredCoupon({
          code: action.payload.couponCode,
          discount: action.payload.discount,
          discountType: 'fixed', // You can enhance this based on API response
          appliedAt: Date.now()
        })
      })
      .addCase(removeCoupon.fulfilled, (state, action) => {
        state.discount = 0
        state.couponCode = undefined
        clearStoredCoupon()
      })
  },
})

export const { clearCart, calculateTotals, loadFromStorage } = cartSlice.actions
export default cartSlice.reducer