"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Filter, Search, X, AlertCircle } from "lucide-react"
import { ProductCard } from "@/components/product/product-card"
import { SearchFilters } from "@/components/search/search-filters"
import { useDebounce } from "@/hooks/use-debounce"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface Product {
  _id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  rating: number
  sold: number
  featured: boolean
  stock: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function ProductsPageClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedRating, setSelectedRating] = useState<number>(0)
  const [sortBy, setSortBy] = useState("featured")
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  })
  const [initialized, setInitialized] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const searchParams = useSearchParams()
  const debouncedSearch = useDebounce(searchQuery, 500)

  // Initialize filters from URL parameters
  useEffect(() => {
    if (!initialized) {
      const categoryParam = searchParams.get('category')
      const searchParam = searchParams.get('search')
      const sortParam = searchParams.get('sort')
      const featuredParam = searchParams.get('featured')

      if (categoryParam) {
        setSelectedCategories([categoryParam])
      }
      if (searchParam) {
        setSearchQuery(searchParam)
      }
      if (sortParam && ['featured', 'price-low', 'price-high', 'rating', 'newest', 'trending'].includes(sortParam)) {
        setSortBy(sortParam)
      }
      if (featuredParam === 'true') {
        // Could add featured filter
      }

      setInitialized(true)
    }
  }, [searchParams, initialized])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort: sortBy,
      })

      if (debouncedSearch) params.append("search", debouncedSearch)
      if (selectedCategories.length > 0) params.append("category", selectedCategories.join(","))
      if (selectedSizes.length > 0) params.append("sizes", selectedSizes.join(","))
      if (selectedBrands.length > 0) params.append("brands", selectedBrands.join(","))
      if (selectedRating > 0) params.append("rating", selectedRating.toString())
      if (priceRange[0] > 0) params.append("minPrice", priceRange[0].toString())
      if (priceRange[1] < 10000) params.append("maxPrice", priceRange[1].toString())

      const response = await fetch(`/api/products?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      setProducts(data.products || [])
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0
      }))
    } catch (err) {
      console.error("Error fetching products:", err)
      setError("Failed to load products. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, sortBy, debouncedSearch, selectedCategories, selectedSizes, selectedBrands, selectedRating, priceRange])

  useEffect(() => {
    if (!initialized) return
    fetchProducts()
  }, [initialized, fetchProducts])

  // Reset page when filters change
  useEffect(() => {
    if (initialized && pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedCategories, selectedSizes, selectedBrands, selectedRating, priceRange, sortBy])

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedSizes([])
    setPriceRange([0, 10000])
    setSelectedBrands([])
    setSelectedRating(0)
    setSearchQuery("")
  }

  const hasActiveFilters = selectedCategories.length > 0 ||
    selectedSizes.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 10000 ||
    selectedBrands.length > 0 ||
    selectedRating > 0

  // Loading skeleton
  const ProductSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="aspect-[3/4] w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 md:top-20 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {selectedCategories.length > 0 ? selectedCategories.join(", ") : "All Products"}
              <span className="text-gray-500 font-normal text-sm md:text-base ml-2">
                ({pagination.total} Items)
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-500 hidden md:inline">SORT BY</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] md:w-[180px] border-none shadow-none font-semibold text-gray-900 focus:ring-0 pl-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Popular</SelectItem>
                  <SelectItem value="newest">New Arrivals</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="trending">Best Selling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Filter Trigger */}
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden gap-2">
                  <Filter className="h-4 w-4" /> Filter
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {selectedCategories.length + selectedSizes.length + selectedBrands.length + (selectedRating > 0 ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[360px] p-0 overflow-y-auto">
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="text-lg font-bold">Filters</h2>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear All
                    </Button>
                  )}
                </div>
                <div className="p-4">
                  <SearchFilters
                    selectedCategories={selectedCategories}
                    setSelectedCategories={setSelectedCategories}
                    selectedSizes={selectedSizes}
                    setSelectedSizes={setSelectedSizes}
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    selectedBrands={selectedBrands}
                    setSelectedBrands={setSelectedBrands}
                    selectedRating={selectedRating}
                    setSelectedRating={setSelectedRating}
                    className="border-none shadow-none p-0"
                  />
                </div>
                <div className="sticky bottom-0 p-4 border-t bg-white">
                  <Button className="w-full" onClick={() => setMobileFilterOpen(false)}>
                    Show {pagination.total} Products
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-40 max-h-[calc(100vh-160px)] overflow-y-auto pr-2">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-gray-400 text-xs uppercase tracking-wider">Filters</span>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={clearAllFilters}>
                  Clear All
                </Button>
              )}
            </div>
            <SearchFilters
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              selectedSizes={selectedSizes}
              setSelectedSizes={setSelectedSizes}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedBrands={selectedBrands}
              setSelectedBrands={setSelectedBrands}
              selectedRating={selectedRating}
              setSelectedRating={setSelectedRating}
              className="border-none shadow-none p-0"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {/* Active Filters Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedCategories.map(cat => (
                <Badge key={cat} variant="secondary" className="px-3 py-1 bg-white border text-gray-700 hover:bg-gray-50">
                  {cat}
                  <X
                    className="ml-2 h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedCategories(prev => prev.filter(c => c !== cat))}
                  />
                </Badge>
              ))}
              {selectedSizes.map(size => (
                <Badge key={size} variant="secondary" className="px-3 py-1 bg-white border text-gray-700 hover:bg-gray-50">
                  Size: {size}
                  <X
                    className="ml-2 h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedSizes(prev => prev.filter(s => s !== size))}
                  />
                </Badge>
              ))}
              {selectedBrands.map(brand => (
                <Badge key={brand} variant="secondary" className="px-3 py-1 bg-white border text-gray-700 hover:bg-gray-50">
                  {brand}
                  <X
                    className="ml-2 h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedBrands(prev => prev.filter(b => b !== brand))}
                  />
                </Badge>
              ))}
              {selectedRating > 0 && (
                <Badge variant="secondary" className="px-3 py-1 bg-white border text-gray-700 hover:bg-gray-50">
                  {selectedRating}+ Stars
                  <X
                    className="ml-2 h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedRating(0)}
                  />
                </Badge>
              )}
              <Button
                variant="link"
                size="sm"
                className="text-gray-500 h-auto p-0 ml-2"
                onClick={clearAllFilters}
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <Button onClick={fetchProducts}>Try Again</Button>
            </div>
          )}

          {/* Loading State */}
          {loading && !error && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-500 max-w-sm mb-8">
                We couldn't find any products matching your filters. Try adjusting your search or clearing filters.
              </p>
              <Button onClick={clearAllFilters}>Clear All Filters</Button>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center mt-12 gap-4">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
