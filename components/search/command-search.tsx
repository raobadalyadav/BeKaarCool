"use client"

import { useState, useEffect } from "react"
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

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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

  const handleSelect = (value: string, type: "product" | "search" | "category") => {
    onOpenChange(false)
    setQuery("")
    
    switch (type) {
      case "product":
        router.push(`/products/${value}`)
        break
      case "search":
        router.push(`/products?search=${encodeURIComponent(value)}`)
        break
      case "category":
        router.push(`/products?category=${encodeURIComponent(value)}`)
        break
    }
  }

  const quickActions = [
    { label: "Featured Products", value: "featured=true", icon: Sparkles },
    { label: "New Arrivals", value: "sort=newest", icon: TrendingUp },
    { label: "Best Sellers", value: "sort=popular", icon: Package },
  ]

  const categories = ["T-Shirts", "Hoodies", "Mugs", "Posters", "Phone Cases", "Accessories"]
  const trendingSearches = ["Custom T-shirts", "Logo Design", "Personalized Mugs", "Wedding Invitations"]

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
                className="flex items-center gap-3 p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{product.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{minorToRupees(product.priceMinor).toLocaleString()}</p>
                  {product.ratingAvg != null && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span>★</span>
                      <span>{Number(product.ratingAvg).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Quick Actions */}
        {query.length === 0 && (
          <>
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

            <CommandSeparator />

            <CommandGroup heading="Categories">
              {categories.map((category) => (
                <CommandItem
                  key={category}
                  value={category}
                  onSelect={() => handleSelect(category, "category")}
                  className="flex items-center gap-3"
                >
                  <Tag className="h-4 w-4" />
                  <span>{category}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Trending Searches">
              {trendingSearches.map((search) => (
                <CommandItem
                  key={search}
                  value={search}
                  onSelect={() => handleSelect(search, "search")}
                  className="flex items-center gap-3"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>{search}</span>
                  <Badge variant="secondary" className="ml-auto">
                    Trending
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
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