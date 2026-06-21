"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, X, Clock, TrendingUp, ChevronRight, Tag } from "lucide-react"
import * as productsApi from "@/lib/api/products"
import { minorToRupees } from "@/lib/api/config"

const RECENT_KEY = "bf_recent_searches"
const MAX_RECENT = 6

function getRecent(): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") } catch { return [] }
}
function saveRecent(q: string) {
  const prev = getRecent().filter((s) => s.toLowerCase() !== q.toLowerCase())
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)))
}
function removeRecent(q: string) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(getRecent().filter((s) => s !== q)))
}

const TRENDING = ["Oversized T-Shirts", "Graphic Hoodies", "Acid Wash Tees", "Drop Shoulder", "Jogger Pants", "Cargo Shorts"]

interface Hit {
  id: string
  slug: string
  title: string
  priceMinor: number
  image?: string
  brandName?: string
  ratingAvg?: number
}

interface InlineSearchProps {
  className?: string
  placeholder?: string
  onFocusChange?: (focused: boolean) => void
}

export function InlineSearch({ className = "", placeholder = "Search for products, brands and more", onFocusChange }: InlineSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<Hit[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    productsApi.listCategories().then(setCategories).catch(() => {})
  }, [])

  const openDrop = () => {
    setRecent(getRecent())
    setFocused(true)
    onFocusChange?.(true)
  }

  const closeDrop = useCallback(() => {
    setFocused(false)
    setActiveIdx(-1)
    onFocusChange?.(false)
  }, [onFocusChange])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) closeDrop()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [closeDrop])

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.trim().length < 2) { setHits([]); return }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const data = await productsApi.search({ q: query.trim(), first: 6 })
        setHits(
          (data.hits ?? []).map((h: any) => ({
            id: h.id,
            slug: h.slug,
            title: h.title,
            priceMinor: Number(h.priceMinor),
            image: h.image,
            brandName: h.brandId,
            ratingAvg: h.ratingAvg,
          }))
        )
      } catch { setHits([]) }
      finally { setLoading(false) }
    }, 250)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query])

  const navigate = useCallback((q: string) => {
    saveRecent(q)
    closeDrop()
    setQuery("")
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }, [router, closeDrop])

  const goProduct = useCallback((slug: string) => {
    closeDrop()
    setQuery("")
    router.push(`/products/${slug}`)
  }, [router, closeDrop])

  const goCategory = useCallback((id: string) => {
    closeDrop()
    setQuery("")
    router.push(`/products?categoryId=${encodeURIComponent(id)}`)
  }, [router, closeDrop])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { closeDrop(); inputRef.current?.blur(); return }
    if (e.key === "Enter") {
      if (query.trim()) navigate(query.trim())
      return
    }
    const items = dropRef.current?.querySelectorAll("[data-item]") ?? []
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
    }
  }

  const showDrop = focused
  const hasQuery = query.trim().length >= 2

  return (
    <div ref={dropRef} className={`relative w-full ${className}`}>
      {/* Search input */}
      <div className={`flex items-center w-full bg-white border-2 transition-colors rounded-sm overflow-hidden ${focused ? "border-[#F38508]" : "border-gray-200"}`}>
        <Search className="flex-shrink-0 ml-3 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveIdx(-1) }}
          onFocus={openDrop}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="flex-1 h-10 px-3 text-sm text-gray-800 placeholder:text-gray-400 bg-transparent outline-none"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setHits([]); inputRef.current?.focus() }}
            className="flex-shrink-0 mr-1 p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => query.trim() && navigate(query.trim())}
          className="flex-shrink-0 h-10 px-5 bg-[#F38508] hover:bg-[#D97706] text-gray-900 font-semibold text-sm transition-colors"
        >
          Search
        </button>
      </div>

      {/* Dropdown */}
      {showDrop && (
        <div className="absolute left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 shadow-xl rounded-sm z-[200] overflow-hidden max-h-[70vh] overflow-y-auto">

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
              <span className="h-4 w-4 border-2 border-[#F38508] border-t-transparent rounded-full animate-spin" />
              Searching…
            </div>
          )}

          {/* Results when typing */}
          {!loading && hasQuery && (
            <>
              {/* Search suggestion row */}
              <button
                data-item
                onClick={() => navigate(query.trim())}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 ${activeIdx === 0 ? "bg-gray-50" : ""}`}
              >
                <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-800">
                  Search for <span className="font-semibold">"{query.trim()}"</span>
                </span>
                <ChevronRight className="h-4 w-4 text-gray-300 ml-auto flex-shrink-0" />
              </button>

              {/* Product hits */}
              {hits.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Products</p>
                  {hits.map((hit, i) => {
                    const price = minorToRupees(hit.priceMinor)
                    return (
                      <button
                        key={hit.id}
                        data-item
                        onClick={() => goProduct(hit.slug)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${activeIdx === i + 1 ? "bg-gray-50" : ""}`}
                      >
                        <div className="relative flex-shrink-0 w-10 h-12 bg-gray-100 rounded overflow-hidden">
                          {hit.image ? (
                            <Image src={hit.image} alt={hit.title} fill sizes="40px" className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 line-clamp-1 font-medium">{hit.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-bold text-gray-900">₹{price.toLocaleString("en-IN")}</span>
                            {hit.ratingAvg && Number(hit.ratingAvg) > 0 && (
                              <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
                                <span className="text-[#F38508]">★</span>{Number(hit.ratingAvg).toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                      </button>
                    )
                  })}
                  <button
                    data-item
                    onClick={() => navigate(query.trim())}
                    className="w-full px-4 py-2.5 text-sm text-[#F38508] font-semibold text-center hover:bg-orange-50 border-t border-gray-100"
                  >
                    See all results for "{query.trim()}" →
                  </button>
                </div>
              )}

              {!loading && hits.length === 0 && (
                <div className="px-4 py-5 text-sm text-gray-400 text-center">
                  No products found for "{query.trim()}"
                </div>
              )}
            </>
          )}

          {/* Default state — no query */}
          {!hasQuery && !loading && (
            <>
              {/* Recent searches */}
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-4 pt-3 pb-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Searches</p>
                    <button
                      onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]) }}
                      className="text-[10px] text-[#F38508] hover:underline font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                  {recent.map((s) => (
                    <div
                      key={s}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 group cursor-pointer"
                      onClick={() => { setQuery(s); inputRef.current?.focus() }}
                    >
                      <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="flex-1 text-sm text-gray-700">{s}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeRecent(s); setRecent(getRecent()) }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 text-gray-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <hr className="mx-4 border-gray-100 my-1" />
                </div>
              )}

              {/* Trending searches */}
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trending Searches</p>
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {TRENDING.map((t) => (
                    <button
                      key={t}
                      onClick={() => navigate(t)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-orange-50 hover:text-[#D97706] border border-gray-200 hover:border-[#F38508]/40 rounded-full text-xs text-gray-600 font-medium transition-colors"
                    >
                      <TrendingUp className="h-3 w-3" />
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <>
                  <hr className="mx-4 border-gray-100 my-1" />
                  <div>
                    <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Browse Categories</p>
                    {categories.slice(0, 6).map((cat) => (
                      <button
                        key={cat.id}
                        data-item
                        onClick={() => goCategory(cat.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <Tag className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{cat.name}</span>
                        <ChevronRight className="h-4 w-4 text-gray-300 ml-auto flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
