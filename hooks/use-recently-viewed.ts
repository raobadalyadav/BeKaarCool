"use client"

import { useCallback } from "react"

export interface RecentlyViewedProduct {
  id: string
  slug: string
  name: string
  price: number
  originalPrice?: number
  image?: string
  brandName?: string
}

const KEY = "bf_recently_viewed"
const MAX = 12

function getAll(): RecentlyViewedProduct[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]")
  } catch {
    return []
  }
}

function setAll(items: RecentlyViewedProduct[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {}
}

export function useRecentlyViewed() {
  const add = useCallback((product: RecentlyViewedProduct) => {
    const existing = getAll().filter((p) => p.id !== product.id)
    const updated = [product, ...existing].slice(0, MAX)
    setAll(updated)
  }, [])

  const get = useCallback((excludeId?: string): RecentlyViewedProduct[] => {
    const all = getAll()
    return excludeId ? all.filter((p) => p.id !== excludeId) : all
  }, [])

  return { add, get }
}
