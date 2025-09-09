"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface CartItem {
  _id: string
  product: {
    _id: string
    name: string
    price: number
    images: string[]
  }
  quantity: number
  size: string
  color: string
  price: number
}

interface CartContextType {
  items: CartItem[]
  total: number
  itemCount: number
  addToCart: (item: { productId: string; quantity: number; size: string; color: string }) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  loading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [items, setItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const fetchCart = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch("/api/cart")
      const data = await response.json()
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error("Error fetching cart:", error)
    }
  }

  const addToCart = async (item: { productId: string; quantity: number; size: string; color: string }) => {
    if (!session?.user?.id) {
      // Redirect to login or show login modal
      window.location.href = "/auth/login"
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      })

      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (itemId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error("Error removing from cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      })

      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error("Error updating quantity:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      })

      if (response.ok) {
        setItems([])
        setTotal(0)
      }
    } catch (error) {
      console.error("Error clearing cart:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchCart()
    }
  }, [session?.user?.id])

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        itemCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
