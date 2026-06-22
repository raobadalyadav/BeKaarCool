"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import * as productsApi from "@/lib/api/products"
import { minorToRupees } from "@/lib/api/config"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Search, Package, Tag, Sparkles, TrendingUp } from "lucide-react"
import Image from "next/image"

interface CommandSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const RECENT_SEARCHES_KEY = "bf_recent_searches"
const MAX_RECENT = 5

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]") } catch { return [] }
}

function saveRecentSearch(q: string) {
  const existing = getRecentSearches().filter((s) => s !== q)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([q, ...existing].slice(0, MAX_RECENT)))
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    productsApi.listCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (open) setRecentSearches(getRecentSearches())
  }, [open])

  useEffect(() => {
    if (query.length >= 2) {
      searchProducts()
    } else {
      setResults([])
    }
  }, [query])

  const searchProducts = async () => {
    setLoading(true)
    try {
      const data = await productsApi.search({ q: query, first: 8 })
      setResults(data.hits ?? [])
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = useCallback((value: string, type: "product" | "search" | "category") => {
    onOpenChange(false)
    setQuery("")
    switch (type) {
      case "product":
        router.push(`/products/${value}`)
        break
      case "search":
        saveRecentSearch(value)
        router.push(`/search?q=${encodeURIComponent(value)}`)
        break
      case "category":
        router.push(`/products?categoryId=${encodeURIComponent(value)}`)
        break
    }
  }, [router, onOpenChange])

  const quickActions = [
    { label: "Featured Products", value: "featured=true", icon: Sparkles },
    { label: "New Arrivals", value: "sort=newest", icon: TrendingUp },
    { label: "Best Sellers", value: "sort=popular", icon: Package },
  ]

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search products, categories, brands..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : (
            <div className="py-6 text-center text-sm">
              {query.length >= 2 ? "No results found." : "Start typing to search..."}
            </div>
          )}
        </CommandEmpty>

        {/* Search Results */}
        {results.length > 0 && (
          <CommandGroup heading="Products">
            {results.map((product) => (
              <CommandItem
                key={product.id}
                value={product.id}
                onSelect={() => handleSelect(product.slug ?? product.id, "product")}
                className="flex items-center gap-3 p-2"
              >
                <div className="relative h-12 w-10 flex-shrink-0 bg-muted rounded overflow-hidden">
                  {product.image ? (
                    <Image src={product.image} alt={product.title} fill sizes="40px" className="object-cover" />
                  ) : (
                    <Package className="w-5 h-5 m-auto text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{product.title}</p>
                  {product.ratingAvg != null && product.ratingAvg > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="text-brand-500">★</span>
                      <span>{Number(product.ratingAvg).toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">₹{minorToRupees(product.priceMinor).toLocaleString()}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Quick Actions + Categories + Recent searches */}
        {query.length === 0 && (
          <>
            {recentSearches.length > 0 && (
              <>
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((s) => (
                    <CommandItem
                      key={s}
                      value={`recent-${s}`}
                      onSelect={() => handleSelect(s, "search")}
                      className="flex items-center gap-3"
                    >
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span>{s}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            <CommandGroup heading="Quick Actions">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <CommandItem
                    key={action.value}
                    value={action.label}
                    onSelect={() => router.push(`/products?${action.value}`)}
                    className="flex items-center gap-3"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            {categories.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Categories">
                  {categories.slice(0, 8).map((cat) => (
                    <CommandItem
                      key={cat.id}
                      value={cat.name}
                      onSelect={() => handleSelect(cat.id, "category")}
                      className="flex items-center gap-3"
                    >
                      <Tag className="h-4 w-4" />
                      <span>{cat.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}

        {/* Search Suggestions */}
        {query.length >= 2 && results.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Search for">
              <CommandItem
                value={`search-${query}`}
                onSelect={() => handleSelect(query, "search")}
                className="flex items-center gap-3"
              >
                <Search className="h-4 w-4" />
                <span>Search for &ldquo;{query}&rdquo;</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}