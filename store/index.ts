import { configureStore } from "@reduxjs/toolkit"
import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import authSlice from "./slices/auth-slice"
import cartSlice from "./slices/cart-slice"
import productSlice from "./slices/product-slice"
import orderSlice from "./slices/order-slice"
import inventorySlice from "./slices/inventory-slice"
import analyticsSlice from "./slices/analytics-slice"
import marketingSlice from "./slices/marketing-slice"
import supportSlice from "./slices/support-slice"

export const store = configureStore({
  reducer: {
    auth: authSlice,
    cart: cartSlice,
    products: productSlice,
    orders: orderSlice,
    inventory: inventorySlice,
    analytics: analyticsSlice,
    marketing: marketingSlice,
    support: supportSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
