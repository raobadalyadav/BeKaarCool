"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Filter, Search, Grid3X3, List, Loader2, X } from "lucide-react"
import { ProductCard } from "@/components/product/product-card"
import { SearchFilters } from "@/components/search/search-filters"
import { useDebounce } from "@/hooks/use-debounce"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default function ProductsPageClient() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("featured")
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  })
  const [initialized, setInitialized] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const debouncedSearch = useDebounce(searchQuery, 500)

  // Initialize filters from URL parameters
  useEffect(() => {
    if (!initialized) {
      const categoryParam = searchParams.get('category')
      const searchParam = searchParams.get('search')
      const sortParam = searchParams.get('sort')
      const saleParam = searchParams.get('sale')
      const recommendedParam = searchParams.get('recommended')
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
      
      setInitialized(true)
    }
  }, [searchParams, initialized])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort: sortBy,
      })

      if (debouncedSearch) params.append("search", debouncedSearch)
      if (selectedCategories.length > 0) params.append("category", selectedCategories.join(","))
      if (selectedSizes.length > 0) params.append("sizes", selectedSizes.join(","))
      if (priceRange[0] > 0) params.append("minPrice", priceRange[0].toString())
      if (priceRange[1] < 5000) params.append("maxPrice", priceRange[1].toString())

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      setProducts(data.products || [])
      setPagination(data.pagination || pagination)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialized) return
    
    // Reset to page 1 when search or filters change
    if (pagination.page !== 1 && (debouncedSearch || selectedCategories.length > 0 || selectedSizes.length > 0 || priceRange[0] > 0 || priceRange[1] < 5000)) {
      setPagination(prev => ({ ...prev, page: 1 }))
    } else {
      fetchProducts()
    }
  }, [pagination.page, sortBy, debouncedSearch, selectedCategories, selectedSizes, priceRange, initialized])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Products</h1>
        <p className="text-gray-600">Discover our complete collection of custom products</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block w-64">
          <SearchFilters
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            selectedSizes={selectedSizes}
            setSelectedSizes={setSelectedSizes}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search and Controls */}
          <div className="bg-white p-4 rounded-lg border mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, brand, category..."
                    className="pl-10 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Mobile Filter */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden bg-transparent">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0">
                    <SheetHeader className="p-6 pb-0">
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="p-6 pt-0">
                      <SearchFilters
                        selectedCategories={selectedCategories}
                        setSelectedCategories={setSelectedCategories}
                        selectedSizes={selectedSizes}
                        setSelectedSizes={setSelectedSizes}
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        className="border-0 shadow-none p-0 sticky-none"
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Count and Active Filters */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-gray-600">
                {debouncedSearch ? (
                  <span>
                    Found {pagination.total} products for 
                    <span className="font-medium text-primary">"{debouncedSearch}"</span>
                  </span>
                ) : (
                  <span>Showing {products.length} of {pagination.total} products</span>
                )}
              </p>
              
              {/* Active Filters */}
              {(selectedCategories.length > 0 || selectedSizes.length > 0 || priceRange[0] > 0 || priceRange[1] < 5000) && (
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((category) => (
                    <Badge key={category} variant="secondary" className="flex items-center gap-1">
                      {category}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => setSelectedCategories(prev => prev.filter(c => c !== category))}
                      />
                    </Badge>
                  ))}
                  {selectedSizes.map((size) => (
                    <Badge key={size} variant="secondary" className="flex items-center gap-1">
                      Size: {size}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => setSelectedSizes(prev => prev.filter(s => s !== size))}
                      />
                    </Badge>
                  ))}
                  {(priceRange[0] > 0 || priceRange[1] < 5000) && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      ₹{priceRange[0]} - ₹{priceRange[1]}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => setPriceRange([0, 5000])}
                      />
                    </Badge>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedCategories([])
                      setSelectedSizes([])
                      setPriceRange([0, 5000])
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Products Grid/List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">
                {debouncedSearch 
                  ? `No products found for "${debouncedSearch}"` 
                  : "No products match your current filters"}
              </p>
              {debouncedSearch && (
                <p className="text-sm text-muted-foreground mb-6">
                  Try searching for similar terms or browse our categories
                </p>
              )}
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategories([])
                    setSelectedSizes([])
                    setPriceRange([0, 5000])
                  }}
                >
                  Clear all filters
                </Button>
                <Button variant="default" onClick={() => router.push("/products")}>
                  Browse all products
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`grid gap-6 ${
                viewMode === "grid" ? "grid-cols-2 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              }`}
            >
              {products.map((product: any) => (
                <ProductCard key={product._id} product={product} viewMode={viewMode} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>

              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={pagination.page === page ? "default" : "outline"}
                  onClick={() => setPagination((prev) => ({ ...prev, page }))}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
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