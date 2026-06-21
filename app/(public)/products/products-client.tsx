"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Filter, Search, X, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { ProductCard } from "@/components/product/product-card"
import { SearchFilters } from "@/components/search/search-filters"
import { useDebounce } from "@/hooks/use-debounce"
import { useSearchParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import * as productsApi from "@/lib/api/products"
import { minorToRupees } from "@/lib/api/config"

// Sort clothing sizes in a logical order
const SIZE_ORDER = ["XXS","XS","S","M","L","XL","XXL","XXXL","3XL","4XL","Free Size"]
function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.toUpperCase())
    const bi = SIZE_ORDER.indexOf(b.toUpperCase())
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    const na = parseFloat(a), nb = parseFloat(b)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return a.localeCompare(b)
  })
}

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
  variants?: any[]
}

// Cursor-based pages — we keep a stack of cursors
interface PageState {
  after?: string      // cursor to pass to API for this page
  endCursor?: string  // cursor returned by API (next page start)
}

export default function ProductsPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedRating, setSelectedRating] = useState<number>(0)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState("newest")
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const PAGE_SIZE = 24

  // Derived filter options from loaded products
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [availableColors, setAvailableColors] = useState<string[]>([])

  // Cursor-based pagination
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined]) // [page1_cursor, page2_cursor, ...]
  const [currentPage, setCurrentPage] = useState(0) // index into cursorStack
  const [hasNextPage, setHasNextPage] = useState(false)

  const [filterOptions, setFilterOptions] = useState<{
    categories: Array<{ name: string; count: number }>
    brands: string[]
    sizes: string[]
    priceRange: { min: number; max: number }
  }>({
    categories: [],
    brands: [],
    sizes: [],
    priceRange: { min: 0, max: 10000 }
  })

  // name → id maps
  const categoryIdMapRef = useRef<Record<string, string>>({})
  const brandIdMapRef = useRef<Record<string, string>>({})
  // id → name maps (for display from URL params)
  const categoryNameMapRef = useRef<Record<string, string>>({})

  const debouncedSearch = useDebounce(searchQuery, 400)
  const fetchingRef = useRef(false)
  const filterOptionsFetchedRef = useRef(false)

  // ── Core fetch ──────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (afterCursor?: string) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    setError(null)

    try {
      let mapped: Product[]

      if (debouncedSearch) {
        // ── Search mode: use Elasticsearch ──────────────────────────
        const sortMap: Record<string, "price_asc" | "price_desc" | "rating_desc" | "popularity" | undefined> = {
          "price-low": "price_asc",
          "price-high": "price_desc",
          "rating": "rating_desc",
          "trending": "popularity",
        }

        // Build category/brand ID arrays for search filter
        const categoryIds = selectedCategories
          .map(n => categoryIdMapRef.current[n])
          .filter(Boolean)
        const brandIds = selectedBrands
          .map(n => brandIdMapRef.current[n])
          .filter(Boolean)

        const result = await productsApi.search({
          q: debouncedSearch,
          first: PAGE_SIZE,
          sort: sortMap[sortBy],
          filter: {
            ...(categoryIds.length > 0 && { categoryIds }),
            ...(brandIds.length > 0 && { brandIds }),
            ...(priceRange[0] > 0 && { minPriceMinor: priceRange[0] * 100 }),
            ...(priceRange[1] < 10000 && { maxPriceMinor: priceRange[1] * 100 }),
            ...(selectedRating > 0 && { minRating: selectedRating }),
          },
        })

        mapped = result.hits.map((h) => ({
          _id: h.id,
          name: h.title,
          slug: h.slug,
          description: "",
          price: minorToRupees(h.priceMinor),
          images: h.image ? [h.image] : [],
          category: h.categoryId ?? "",
          rating: h.ratingAvg ?? 0,
          sold: 0,
          featured: false,
          stock: h.inStock ? 100 : 0,
        }))
        setTotalCount(result.estimatedTotalHits)
        setHasNextPage(false) // search doesn't do cursor pagination
      } else {
        // ── Products list mode: use GraphQL cursor pagination ───────
        const categoryId = selectedCategories.length > 0
          ? categoryIdMapRef.current[selectedCategories[0]]
          : undefined

        const brandId = selectedBrands.length > 0
          ? brandIdMapRef.current[selectedBrands[0]]
          : undefined

        const conn = await productsApi.listProducts({
          first: PAGE_SIZE,
          after: afterCursor,
          status: "published",
          categoryId,
          brandId,
        })

        // Apply client-side price & rating filter (backend doesn't support these yet)
        mapped = conn.edges
          .map((e) => {
            const v = e.node.variants?.[0]
            const price = v ? minorToRupees(v.priceMinor) : 0
            const originalPrice = v?.compareAtMinor ? minorToRupees(v.compareAtMinor) : undefined
            return {
              _id: e.node.id,
              name: e.node.title,
              slug: e.node.slug,
              description: e.node.descriptionHtml ?? "",
              price,
              originalPrice,
              images: e.node.images ?? [],
              category: e.node.categoryId ?? "",
              rating: Number(e.node.ratingAvg ?? 0),
              sold: 0,
              featured: false,
              stock: v?.inStock ? 100 : 0,
              variants: e.node.variants,
            }
          })
          .filter(p => {
            if (inStockOnly && p.stock <= 0) return false
            if (priceRange[0] > 0 && p.price < priceRange[0]) return false
            if (priceRange[1] < 10000 && p.price > priceRange[1]) return false
            if (selectedRating > 0 && p.rating < selectedRating) return false
            // Color filter: check if any variant matches a selected color
            if (selectedColors.length > 0) {
              const variantColors = (p.variants ?? []).flatMap((v: any) => {
                try {
                  const opts: Record<string, string> = JSON.parse(v.optionsJson ?? "{}")
                  return [opts.color, opts.Color, opts.colour, opts.Colour].filter(Boolean)
                } catch { return [] }
              })
              if (!selectedColors.some(sc => variantColors.some((vc: string) => vc?.toLowerCase() === sc.toLowerCase()))) return false
            }
            // Size filter: check if any variant matches a selected size
            if (selectedSizes.length > 0) {
              const variantSizes = (p.variants ?? []).flatMap((v: any) => {
                try {
                  const opts: Record<string, string> = JSON.parse(v.optionsJson ?? "{}")
                  return [opts.size, opts.Size].filter(Boolean)
                } catch { return [] }
              })
              if (!selectedSizes.some(ss => variantSizes.some((vs: string) => vs?.toLowerCase() === ss.toLowerCase()))) return false
            }
            return true
          })

        // Apply client-side sort
        if (sortBy === "price-low") mapped.sort((a, b) => a.price - b.price)
        else if (sortBy === "price-high") mapped.sort((a, b) => b.price - a.price)
        else if (sortBy === "rating") mapped.sort((a, b) => b.rating - a.rating)

        setHasNextPage(conn.pageInfo.hasNextPage)
        // Store end cursor so next page button can use it
        if (conn.pageInfo.hasNextPage && conn.pageInfo.endCursor) {
          setCursorStack(prev => {
            const next = [...prev]
            // If we're adding a new page at the end, push the cursor
            if (currentPage >= next.length - 1) {
              next.push(conn.pageInfo.endCursor!)
            }
            return next
          })
        }
        setTotalCount(conn.edges.length + (conn.pageInfo.hasNextPage ? PAGE_SIZE : 0))
      }

      setProducts(mapped)

      // Extract unique sizes & colors from variant options (for filter dropdowns)
      const sizeSet = new Set<string>()
      const colorSet = new Set<string>()
      for (const p of mapped) {
        for (const v of (p.variants ?? [])) {
          try {
            const opts: Record<string, string> = JSON.parse((v as any).optionsJson ?? "{}")
            const s = opts.size || opts.Size; if (s) sizeSet.add(s)
            const c = opts.color || opts.Color || opts.colour || opts.Colour; if (c) colorSet.add(c)
          } catch { /* ignore */ }
        }
      }
      if (sizeSet.size > 0) setAvailableSizes(sortSizes([...sizeSet]))
      if (colorSet.size > 0) setAvailableColors([...colorSet])
    } catch (err) {
      console.error("Error fetching products:", err)
      setError("Failed to load products. Please try again.")
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedCategories, selectedBrands, sortBy, priceRange, selectedRating, inStockOnly])

  // ── Load filter options (categories + brands) ───────────────────────
  const fetchFilterOptions = async () => {
    try {
      const [cats, brands] = await Promise.all([
        productsApi.listCategories(),
        productsApi.listBrands(),
      ])
      categoryIdMapRef.current = Object.fromEntries(cats.map((c) => [c.name, c.id]))
      categoryNameMapRef.current = Object.fromEntries(cats.map((c) => [c.id, c.name]))
      brandIdMapRef.current = Object.fromEntries(brands.map((b) => [b.name, b.id]))
      setFilterOptions({
        categories: cats.map((c) => ({ name: c.name, count: c.productCount ?? 0 })),
        brands: brands.map((b) => b.name),
        sizes: [],
        priceRange: { min: 0, max: 10000 },
      })
    } catch (err) {
      console.error("Error fetching filter options:", err)
    }
  }

  // ── Bootstrap: read URL params → fetch filters → fetch products ─────
  useEffect(() => {
    if (filterOptionsFetchedRef.current) return
    filterOptionsFetchedRef.current = true

    const categoryParam = searchParams.get("category")
    const searchParam = searchParams.get("search")
    const sortParam = searchParams.get("sort")
    const brandParam = searchParams.get("brand")

    if (searchParam) setSearchQuery(searchParam)
    if (sortParam && ["featured", "price-low", "price-high", "rating", "newest", "trending"].includes(sortParam)) {
      setSortBy(sortParam)
    }

    // Category/brand params are names from URL — we set them after filter options load
    fetchFilterOptions().then(() => {
      if (categoryParam) {
        // Try to resolve from name map; fallback to using the param as a name string
        setSelectedCategories([categoryParam])
      }
      if (brandParam) {
        setSelectedBrands([brandParam])
      }
      setInitialized(true)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Trigger fetch when initialized or filters change ────────────────
  useEffect(() => {
    if (!initialized) return
    // Reset pagination on filter change
    setCurrentPage(0)
    setCursorStack([undefined])
    fetchProducts(undefined)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, debouncedSearch, selectedCategories, selectedBrands, sortBy, priceRange, selectedRating])

  // ── Pagination handlers ─────────────────────────────────────────────
  const goNextPage = () => {
    const nextPage = currentPage + 1
    const nextCursor = cursorStack[nextPage]
    setCurrentPage(nextPage)
    fetchProducts(nextCursor)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const goPrevPage = () => {
    const prevPage = currentPage - 1
    const prevCursor = cursorStack[prevPage]
    setCurrentPage(prevPage)
    fetchProducts(prevCursor)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedSizes([])
    setSelectedColors([])
    setPriceRange([0, 10000])
    setSelectedBrands([])
    setSelectedRating(0)
    setInStockOnly(false)
    setSearchQuery("")
    router.push("/products")
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 10000 ||
    selectedBrands.length > 0 ||
    selectedRating > 0 ||
    inStockOnly

  const activeFilterCount =
    selectedCategories.length +
    selectedSizes.length +
    selectedColors.length +
    selectedBrands.length +
    (selectedRating > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0) +
    (inStockOnly ? 1 : 0)

  const ProductSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="aspect-[3/4] w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )

  const FiltersPanel = () => (
    <SearchFilters
      categories={filterOptions.categories}
      selectedCategories={selectedCategories}
      setSelectedCategories={setSelectedCategories}
      sizes={availableSizes.length > 0 ? availableSizes : filterOptions.sizes}
      selectedSizes={selectedSizes}
      setSelectedSizes={setSelectedSizes}
      colors={availableColors}
      selectedColors={selectedColors}
      setSelectedColors={setSelectedColors}
      priceRange={priceRange}
      setPriceRange={setPriceRange}
      priceRangeLimit={filterOptions.priceRange}
      brands={filterOptions.brands}
      selectedBrands={selectedBrands}
      setSelectedBrands={setSelectedBrands}
      selectedRating={selectedRating}
      setSelectedRating={setSelectedRating}
      inStockOnly={inStockOnly}
      setInStockOnly={setInStockOnly}
      className="border-none shadow-none p-0"
    />
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Sticky toolbar ── */}
      <div className="bg-white border-b sticky top-16 md:top-20 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#111827]">
              {selectedCategories.length > 0 ? selectedCategories.join(", ") : "All Products"}
              <span className="text-gray-400 font-normal text-sm md:text-base ml-2">
                {products.length > 0 && !loading ? `(${products.length}${hasNextPage ? "+" : ""} items)` : ""}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 hidden md:inline uppercase tracking-wide">Sort</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px] border-[#E5E7EB] text-sm font-semibold text-[#111827] focus:ring-[#F38508]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">New Arrivals</SelectItem>
                  <SelectItem value="featured">Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low → High</SelectItem>
                  <SelectItem value="price-high">Price: High → Low</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="trending">Best Selling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile filter trigger */}
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden gap-2 border-[#E5E7EB] text-[#111827]">
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-[#F38508] text-white border-0">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[360px] p-0 overflow-y-auto">
                <div className="p-4 border-b flex items-center justify-between bg-[#111827] text-white">
                  <h2 className="text-base font-bold">Filters</h2>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" className="text-orange-300 hover:text-white h-auto" onClick={clearAllFilters}>
                      Clear All
                    </Button>
                  )}
                </div>
                <div className="p-4">
                  <FiltersPanel />
                </div>
                <div className="sticky bottom-0 p-4 border-t bg-white">
                  <Button
                    className="w-full bg-[#F38508] hover:bg-[#D97706] text-white font-bold"
                    onClick={() => setMobileFilterOpen(false)}
                  >
                    Show Results
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex gap-6">
        {/* ── Desktop Sidebar ── */}
        <div className="hidden lg:block w-60 flex-shrink-0">
          <div className="sticky top-40 max-h-[calc(100vh-170px)] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-[#111827] text-xs uppercase tracking-wider">Filters</span>
              {hasActiveFilters && (
                <button
                  className="text-xs text-[#F38508] font-semibold hover:underline"
                  onClick={clearAllFilters}
                >
                  Clear All
                </button>
              )}
            </div>
            <FiltersPanel />
          </div>
        </div>

        {/* ── Product Grid ── */}
        <div className="flex-1 min-w-0">
          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-5">
              {selectedCategories.map(cat => (
                <Badge
                  key={cat}
                  className="px-3 py-1 bg-[#F38508]/10 text-[#F38508] border border-[#F38508]/30 font-medium text-xs cursor-pointer hover:bg-[#F38508]/20"
                  onClick={() => setSelectedCategories(prev => prev.filter(c => c !== cat))}
                >
                  {cat} <X className="ml-1.5 h-3 w-3 inline" />
                </Badge>
              ))}
              {selectedBrands.map(brand => (
                <Badge
                  key={brand}
                  className="px-3 py-1 bg-[#5AA1E3]/10 text-[#5AA1E3] border border-[#5AA1E3]/30 font-medium text-xs cursor-pointer hover:bg-[#5AA1E3]/20"
                  onClick={() => setSelectedBrands(prev => prev.filter(b => b !== brand))}
                >
                  {brand} <X className="ml-1.5 h-3 w-3 inline" />
                </Badge>
              ))}
              {selectedSizes.map(size => (
                <Badge
                  key={size}
                  variant="secondary"
                  className="px-3 py-1 bg-white border text-gray-700 hover:bg-gray-50 text-xs cursor-pointer"
                  onClick={() => setSelectedSizes(prev => prev.filter(s => s !== size))}
                >
                  Size: {size} <X className="ml-1.5 h-3 w-3 inline" />
                </Badge>
              ))}
              {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                <Badge
                  className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs cursor-pointer hover:bg-gray-50"
                  onClick={() => setPriceRange([0, 10000])}
                >
                  ₹{priceRange[0]} – ₹{priceRange[1]} <X className="ml-1.5 h-3 w-3 inline" />
                </Badge>
              )}
              {selectedRating > 0 && (
                <Badge
                  className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedRating(0)}
                >
                  {selectedRating}★ & up <X className="ml-1.5 h-3 w-3 inline" />
                </Badge>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <Button className="bg-[#F38508] hover:bg-[#D97706] text-white" onClick={() => fetchProducts(cursorStack[currentPage])}>
                Try Again
              </Button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !error && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-5">
                <Search className="h-9 w-9 text-[#F38508]" />
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-2">No Products Found</h3>
              <p className="text-gray-500 max-w-sm mb-6 text-sm">
                We couldn&apos;t find any products matching your filters. Try adjusting or clearing them.
              </p>
              <Button className="bg-[#F38508] hover:bg-[#D97706] text-white font-bold" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </div>
          )}

          {/* Products grid */}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && products.length > 0 && (currentPage > 0 || hasNextPage) && (
            <div className="flex justify-center items-center mt-10 gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0}
                onClick={goPrevPage}
                className="gap-1 border-[#E5E7EB] text-[#111827] hover:border-[#F38508] hover:text-[#F38508]"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span className="text-sm text-gray-500 px-2">Page {currentPage + 1}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNextPage}
                onClick={goNextPage}
                className="gap-1 border-[#E5E7EB] text-[#111827] hover:border-[#F38508] hover:text-[#F38508]"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
