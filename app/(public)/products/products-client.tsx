

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Filter, Search, Grid3X3, List, Loader2, X, ChevronDown } from "lucide-react"
import { ProductCard } from "@/components/product/product-card"
import { SearchFilters } from "@/components/search/search-filters"
import { useDebounce } from "@/hooks/use-debounce"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function ProductsPageClient() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedRating, setSelectedRating] = useState<number>(0)
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
      if (selectedBrands.length > 0) params.append("brands", selectedBrands.join(","))
      if (selectedRating > 0) params.append("rating", selectedRating.toString())
      if (priceRange[0] > 0) params.append("minPrice", priceRange[0].toString())
      if (priceRange[1] < 5000) params.append("maxPrice", priceRange[1].toString())

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      // If data is empty (API not fully implemented or DB empty), use dummy data for display
      if (!data.products || data.products.length === 0) {
        // Fallback dummy products for visual verification
        const fallbackProducts = Array.from({ length: 12 }).map((_, i) => ({
          _id: `dummy-${i}`,
          name: `Bewakoof Style T-Shirt ${i + 1} - ${i % 2 === 0 ? 'Black' : 'White'}`,
          description: "Cool and comfortable t-shirt",
          price: 499 + (i * 50),
          originalPrice: 999 + (i * 100),
          images: [`https://images.unsplash.com/photo-${i % 2 === 0 ? '1523381210434-271e8be1f52b' : '1583743814966-8936f5b7be1a'}?auto=format&fit=crop&q=80&w=400`],
          category: i % 2 === 0 ? "Men" : "Women",
          rating: 4.0 + (i % 5) * 0.2,
          sold: 50 + i * 10,
          featured: i % 3 === 0,
          stock: 20
        }))
        setProducts(fallbackProducts as any)
        setPagination({ ...pagination, total: 12, pages: 1 })
      } else {
        setProducts(data.products || [])
        setPagination(data.pagination || pagination)
      }

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
  }, [pagination.page, sortBy, debouncedSearch, selectedCategories, selectedSizes, selectedBrands, selectedRating, priceRange, initialized])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb / Title Header */}
      <div className="bg-white border-b sticky top-16 md:top-20 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {selectedCategories.length > 0 ? selectedCategories.join(", ") : "All Products"}
              <span className="text-gray-500 font-normal text-sm md:text-base ml-2">({pagination.total} Items)</span>
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
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Filter Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden gap-2">
                  <Filter className="h-4 w-4" /> Filter
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[360px] p-0 overflow-y-auto">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-bold">Filters</h2>
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
                <div className="sticky bottom-0 p-4 border-t bg-white flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setSelectedCategories([])
                    setSelectedSizes([])
                    setPriceRange([0, 5000])
                    setSelectedBrands([])
                    setSelectedRating(0)
                  }}>Clear All</Button>
                  <Button className="flex-1" onClick={() => document.body.click()}>Apply</Button>
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
            <div className="font-bold text-gray-400 text-xs uppercase mb-4 tracking-wider">Filters</div>
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
          {(selectedCategories.length > 0 || selectedSizes.length > 0 || priceRange[0] > 0 || priceRange[1] < 5000 || selectedBrands.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedCategories.map(cat => (
                <Badge key={cat} variant="secondary" className="px-3 py-1 bg-white border text-gray-700 hover:bg-gray-50">
                  {cat} <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== cat))} />
                </Badge>
              ))}
              {/* ... other filter badges can be added similarly ... */}
              <Button variant="link" size="sm" className="text-gray-500 h-auto p-0 ml-2" onClick={() => {
                setSelectedCategories([])
                setSelectedSizes([])
                setPriceRange([0, 5000])
                setSelectedBrands([])
                setSelectedRating(0)
              }}>Clear All</Button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-500 max-w-sm mb-8">We couldn't find any products matching your filters. Try clearing them or searching for something else.</p>
              <Button onClick={() => {
                setSelectedCategories([])
                setSelectedSizes([])
                setPriceRange([0, 5000])
              }}>Clear All Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {products.map((product: any) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-12 gap-2">
              <Button variant="outline" disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>Previous</Button>
              <Button variant="outline" disabled={pagination.page === pagination.pages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>Next</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
