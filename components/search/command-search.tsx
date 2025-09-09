"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Search, Package, Tag, User, Sparkles, TrendingUp } from "lucide-react"

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
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=8`)
      const data = await response.json()
      setResults(data.products || [])
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
                key={product._id}
                value={product._id}
                onSelect={() => handleSelect(product._id, "product")}
                className="flex items-center gap-3 p-3"
              >
                <img
                  src={product.images[0] || "/placeholder.svg"}
                  alt={product.name}
                  className="w-10 h-10 rounded-md object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{product.name}</p>
                    {product.featured && <Sparkles className="h-3 w-3 text-yellow-500" />}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{product.category}</span>
                    {product.brand && (
                      <>
                        <span>•</span>
                        <span>{product.brand}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{product.price}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>★</span>
                    <span>{product.rating.toFixed(1)}</span>
                  </div>
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
                <span>Search for "{query}"</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}