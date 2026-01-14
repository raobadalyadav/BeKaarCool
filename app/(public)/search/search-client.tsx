"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
    Search, X, Clock, TrendingUp, ChevronRight, Home, Package, Tag,
    ChevronLeft
} from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface Product {
    _id: string
    name: string
    slug: string
    images: string[]
    price: number
    originalPrice?: number
    discount?: number
    category?: { name: string; slug: string }
    rating?: number
}

interface Suggestion {
    type: "product" | "category"
    text: string
    slug: string
}

export default function SearchClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialQuery = searchParams.get("q") || ""

    const [query, setQuery] = useState(initialQuery)
    const [products, setProducts] = useState<Product[]>([])
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const [popularSearches, setPopularSearches] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)

    const debouncedQuery = useDebounce(query, 300)

    // Fetch recent and popular searches on mount
    useEffect(() => {
        fetchRecentSearches()
        fetchPopularSearches()
    }, [])

    // Fetch suggestions as user types
    useEffect(() => {
        if (debouncedQuery.length >= 2) {
            fetchSuggestions(debouncedQuery)
        } else {
            setSuggestions([])
        }
    }, [debouncedQuery])

    // Perform search when query in URL changes
    useEffect(() => {
        if (initialQuery) {
            performSearch(initialQuery, 1)
        }
    }, [initialQuery])

    const fetchRecentSearches = async () => {
        try {
            const res = await fetch("/api/search?type=recent")
            if (res.ok) {
                const data = await res.json()
                setRecentSearches(data.searches || [])
            }
        } catch (error) {
            console.error("Failed to fetch recent searches:", error)
        }
    }

    const fetchPopularSearches = async () => {
        try {
            const res = await fetch("/api/search?type=popular")
            if (res.ok) {
                const data = await res.json()
                setPopularSearches(data.searches || [])
            }
        } catch (error) {
            console.error("Failed to fetch popular searches:", error)
        }
    }

    const fetchSuggestions = async (q: string) => {
        try {
            const res = await fetch(`/api/search?type=suggestions&q=${encodeURIComponent(q)}`)
            if (res.ok) {
                const data = await res.json()
                setSuggestions(data.suggestions || [])
            }
        } catch (error) {
            console.error("Failed to fetch suggestions:", error)
        }
    }

    const performSearch = async (searchQuery: string, pageNum: number) => {
        if (!searchQuery.trim()) return

        setLoading(true)
        setShowSuggestions(false)

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=20`)
            if (res.ok) {
                const data = await res.json()
                setProducts(data.products || [])
                setTotalPages(data.pagination?.pages || 0)
                setPage(pageNum)
            }
        } catch (error) {
            console.error("Search failed:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`)
            performSearch(query.trim(), 1)
        }
    }

    const handleSuggestionClick = (suggestion: Suggestion) => {
        if (suggestion.type === "category") {
            router.push(`/products?category=${suggestion.slug}`)
        } else {
            router.push(`/products/${suggestion.slug}`)
        }
        setShowSuggestions(false)
    }

    const handleRecentSearch = (search: string) => {
        setQuery(search)
        router.push(`/search?q=${encodeURIComponent(search)}`)
        performSearch(search, 1)
    }

    const clearRecentSearches = async () => {
        try {
            await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "clear" })
            })
            setRecentSearches([])
        } catch (error) {
            console.error("Failed to clear searches:", error)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumbs */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-3">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-yellow-600">
                            <Home className="w-4 h-4" />
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">Search</span>
                        {initialQuery && (
                            <>
                                <ChevronRight className="w-4 h-4" />
                                <span className="text-gray-900">"{initialQuery}"</span>
                            </>
                        )}
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Search Box */}
                <div className="max-w-2xl mx-auto mb-8">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search for products, brands, categories..."
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                setShowSuggestions(true)
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            className="pl-12 pr-12 py-6 text-lg rounded-full border-2 border-gray-200 focus:border-yellow-400"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery("")}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2"
                            >
                                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                            </button>
                        )}

                        {/* Suggestions Dropdown */}
                        {showSuggestions && (query.length >= 2 || recentSearches.length > 0 || popularSearches.length > 0) && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
                                {/* Suggestions */}
                                {suggestions.length > 0 && (
                                    <div className="p-4 border-b">
                                        {suggestions.map((s, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSuggestionClick(s)}
                                                className="w-full flex items-center gap-3 py-2 px-3 hover:bg-gray-50 rounded text-left"
                                            >
                                                {s.type === "category" ? (
                                                    <Tag className="w-4 h-4 text-gray-400" />
                                                ) : (
                                                    <Package className="w-4 h-4 text-gray-400" />
                                                )}
                                                <span>{s.text}</span>
                                                <Badge variant="secondary" className="ml-auto text-xs">
                                                    {s.type}
                                                </Badge>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Recent Searches */}
                                {recentSearches.length > 0 && !query && (
                                    <div className="p-4 border-b">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                                                <Clock className="w-4 h-4" /> Recent Searches
                                            </span>
                                            <button
                                                onClick={clearRecentSearches}
                                                className="text-xs text-red-500 hover:underline"
                                            >
                                                Clear all
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {recentSearches.map(search => (
                                                <button
                                                    key={search}
                                                    onClick={() => handleRecentSearch(search)}
                                                    className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
                                                >
                                                    {search}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Popular Searches */}
                                {popularSearches.length > 0 && !query && (
                                    <div className="p-4">
                                        <span className="text-sm font-semibold text-gray-600 flex items-center gap-1 mb-2">
                                            <TrendingUp className="w-4 h-4" /> Popular Searches
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {popularSearches.map(search => (
                                                <button
                                                    key={search}
                                                    onClick={() => handleRecentSearch(search)}
                                                    className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm hover:bg-yellow-100"
                                                >
                                                    {search}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <Card key={i}>
                                <Skeleton className="h-48 w-full" />
                                <CardContent className="p-4">
                                    <Skeleton className="h-4 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : products.length === 0 && initialQuery ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700">No products found</h3>
                            <p className="text-gray-500 mt-2">Try different keywords or browse categories</p>
                            <Link href="/products">
                                <Button className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
                                    Browse All Products
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : products.length > 0 ? (
                    <>
                        <p className="text-gray-600 mb-4">
                            Found {totalPages > 1 ? `${(page - 1) * 20 + 1}-${Math.min(page * 20, products.length)} results` : `${products.length} results`} for "{initialQuery}"
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {products.map(product => (
                                <Link key={product._id} href={`/products/${product.slug}`}>
                                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                                        <div className="relative h-48 bg-gray-100">
                                            <Image
                                                src={product.images?.[0] || "/placeholder.svg"}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                            />
                                            {product.discount && product.discount > 0 && (
                                                <Badge className="absolute top-2 left-2 bg-red-500">
                                                    {product.discount}% OFF
                                                </Badge>
                                            )}
                                        </div>
                                        <CardContent className="p-4">
                                            <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-yellow-600">
                                                {product.name}
                                            </h3>
                                            {product.category && (
                                                <p className="text-xs text-gray-500 mt-1">{product.category.name}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="font-bold text-lg">₹{product.price}</span>
                                                {product.originalPrice && product.originalPrice > product.price && (
                                                    <span className="text-sm text-gray-400 line-through">
                                                        ₹{product.originalPrice}
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-8">
                                <Button
                                    variant="outline"
                                    disabled={page === 1}
                                    onClick={() => performSearch(initialQuery, page - 1)}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                                </Button>
                                <span className="text-sm text-gray-600">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    disabled={page === totalPages}
                                    onClick={() => performSearch(initialQuery, page + 1)}
                                >
                                    Next <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">Start searching</h3>
                        <p className="text-gray-500 mt-2">Enter a product name, brand, or category</p>
                    </div>
                )}
            </div>
        </div>
    )
}
