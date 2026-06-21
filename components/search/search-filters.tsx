"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Star, Package } from "lucide-react"

// ── Well-known color definitions ──────────────────────────────────────────────
const COLOR_MAP: Record<string, { hex: string; label: string }> = {
  red:     { hex: "#EF4444", label: "Red" },
  blue:    { hex: "#3B82F6", label: "Blue" },
  green:   { hex: "#22C55E", label: "Green" },
  black:   { hex: "#111827", label: "Black" },
  white:   { hex: "#F9FAFB", label: "White" },
  yellow:  { hex: "#F38508", label: "Yellow" },
  orange:  { hex: "#F97316", label: "Orange" },
  pink:    { hex: "#EC4899", label: "Pink" },
  purple:  { hex: "#8B5CF6", label: "Purple" },
  gray:    { hex: "#9CA3AF", label: "Gray" },
  grey:    { hex: "#9CA3AF", label: "Grey" },
  brown:   { hex: "#92400E", label: "Brown" },
  navy:    { hex: "#1E3A5F", label: "Navy" },
  maroon:  { hex: "#7F1D1D", label: "Maroon" },
  beige:   { hex: "#D4B483", label: "Beige" },
  cream:   { hex: "#FFFDD0", label: "Cream" },
  gold:    { hex: "#D4AF37", label: "Gold" },
  silver:  { hex: "#C0C0C0", label: "Silver" },
  teal:    { hex: "#14B8A6", label: "Teal" },
  cyan:    { hex: "#06B6D4", label: "Cyan" },
  indigo:  { hex: "#6366F1", label: "Indigo" },
  magenta: { hex: "#D946EF", label: "Magenta" },
  violet:  { hex: "#7C3AED", label: "Violet" },
  coral:   { hex: "#F87171", label: "Coral" },
  lavender:{ hex: "#C4B5FD", label: "Lavender" },
  mustard: { hex: "#D97706", label: "Mustard" },
  olive:   { hex: "#65A30D", label: "Olive" },
  mint:    { hex: "#A7F3D0", label: "Mint" },
  charcoal:{ hex: "#374151", label: "Charcoal" },
  khaki:   { hex: "#C3B091", label: "Khaki" },
  rust:    { hex: "#B45309", label: "Rust" },
  sand:    { hex: "#FCD34D", label: "Sand" },
  rose:    { hex: "#FB7185", label: "Rose" },
  off_white:{ hex: "#FAF9F6", label: "Off White" },
}

function getColorInfo(name: string): { hex: string; label: string } {
  const key = name.toLowerCase().replace(/[\s-]+/g, "_").replace("off_white", "off_white")
  return COLOR_MAP[key] ?? COLOR_MAP[name.toLowerCase()] ?? { hex: "#E5E7EB", label: name }
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface SearchFiltersProps {
  // Category
  categories: Array<{ name: string; count: number }>
  selectedCategories: string[]
  setSelectedCategories: (v: string[]) => void
  // Size
  sizes: string[]
  selectedSizes: string[]
  setSelectedSizes: (v: string[]) => void
  // Color
  colors?: string[]
  selectedColors?: string[]
  setSelectedColors?: (v: string[]) => void
  // Brand
  brands: string[]
  selectedBrands?: string[]
  setSelectedBrands?: (v: string[]) => void
  // Price
  priceRange: number[]
  setPriceRange: (v: number[]) => void
  priceRangeLimit: { min: number; max: number }
  // Rating
  selectedRating?: number
  setSelectedRating?: (v: number) => void
  // Stock
  inStockOnly?: boolean
  setInStockOnly?: (v: boolean) => void
  // Misc
  className?: string
}

type SectionKey = "categories" | "price" | "sizes" | "colors" | "brands" | "rating" | "availability"

export function SearchFilters({
  categories,
  selectedCategories,
  setSelectedCategories,
  sizes,
  selectedSizes,
  setSelectedSizes,
  colors = [],
  selectedColors = [],
  setSelectedColors,
  brands,
  selectedBrands = [],
  setSelectedBrands,
  priceRange,
  setPriceRange,
  priceRangeLimit,
  selectedRating,
  setSelectedRating,
  inStockOnly = false,
  setInStockOnly,
  className,
}: SearchFiltersProps) {
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    categories:   true,
    price:        true,
    sizes:        sizes.length > 0,
    colors:       colors.length > 0,
    brands:       true,
    rating:       false,
    availability: false,
  })

  const toggle = (s: SectionKey) => setOpen(prev => ({ ...prev, [s]: !prev[s] }))

  const clearAll = () => {
    setSelectedCategories([])
    setSelectedSizes([])
    if (setSelectedColors) setSelectedColors([])
    if (setSelectedBrands) setSelectedBrands([])
    setPriceRange([priceRangeLimit.min, priceRangeLimit.max])
    if (setSelectedRating) setSelectedRating(0)
    if (setInStockOnly) setInStockOnly(false)
  }

  const hasActive =
    selectedCategories.length > 0 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    selectedBrands.length > 0 ||
    priceRange[0] > priceRangeLimit.min ||
    priceRange[1] < priceRangeLimit.max ||
    (selectedRating ?? 0) > 0 ||
    inStockOnly

  const toggleItem = <T,>(arr: T[], item: T, setter: (v: T[]) => void) => {
    setter(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item])
  }

  const SectionHeader = ({ label, sectionKey, count }: { label: string; sectionKey: SectionKey; count?: number }) => (
    <CollapsibleTrigger className="flex items-center justify-between w-full py-0.5 group">
      <span className="font-semibold text-[#111827] text-sm flex items-center gap-2">
        {label}
        {count !== undefined && count > 0 && (
          <span className="text-[10px] font-bold bg-[#F38508]/10 text-[#F38508] rounded-full px-1.5 py-0.5">
            {count}
          </span>
        )}
      </span>
      <ChevronDown
        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open[sectionKey] ? "rotate-180" : ""}`}
      />
    </CollapsibleTrigger>
  )

  return (
    <div className={`space-y-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-1">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Filters</h2>
        {hasActive && (
          <button
            onClick={clearAll}
            className="text-[11px] font-bold text-[#F38508] hover:text-[#D97706] uppercase tracking-wide transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* ── 1. Categories ─────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <div className="border-b border-[#E5E7EB] pb-4 pt-3">
          <Collapsible open={open.categories} onOpenChange={() => toggle("categories")}>
            <SectionHeader label="Category" sectionKey="categories" count={selectedCategories.length} />
            <CollapsibleContent className="mt-3 space-y-1.5">
              {categories.map((cat) => (
                <label
                  key={cat.name}
                  className="flex items-center gap-2.5 cursor-pointer group py-0.5"
                >
                  <Checkbox
                    id={`cat-${cat.name}`}
                    checked={selectedCategories.includes(cat.name)}
                    onCheckedChange={() =>
                      toggleItem(selectedCategories, cat.name, setSelectedCategories)
                    }
                    className="border-gray-300 rounded-[2px] data-[state=checked]:bg-[#F38508] data-[state=checked]:border-[#F38508]"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-[#111827] flex-1 transition-colors">
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-gray-400 tabular-nums">
                    {cat.count > 0 ? `(${cat.count})` : ""}
                  </span>
                </label>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* ── 2. Availability ───────────────────────────────────────────── */}
      {setInStockOnly && (
        <div className="border-b border-[#E5E7EB] pb-4 pt-3">
          <Collapsible open={open.availability} onOpenChange={() => toggle("availability")}>
            <SectionHeader label="Availability" sectionKey="availability" />
            <CollapsibleContent className="mt-3">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  id="in-stock-only"
                  checked={inStockOnly}
                  onCheckedChange={(checked) => setInStockOnly(!!checked)}
                  className="border-gray-300 rounded-[2px] data-[state=checked]:bg-[#F38508] data-[state=checked]:border-[#F38508]"
                />
                <span className="text-sm text-gray-600 group-hover:text-[#111827] flex items-center gap-1.5 transition-colors">
                  <Package className="h-3.5 w-3.5 text-green-500" />
                  In Stock Only
                </span>
              </label>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* ── 3. Price Range ────────────────────────────────────────────── */}
      <div className="border-b border-[#E5E7EB] pb-4 pt-3">
        <Collapsible open={open.price} onOpenChange={() => toggle("price")}>
          <SectionHeader label="Price" sectionKey="price" />
          <CollapsibleContent className="mt-4 space-y-3 px-1">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={priceRangeLimit.max || 10000}
              min={priceRangeLimit.min || 0}
              step={50}
              className="w-full"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 text-center bg-[#F8FAFC] border border-[#E5E7EB] rounded px-2 py-1">
                <span className="text-xs text-gray-500 block">Min</span>
                <span className="text-sm font-bold text-[#111827]">₹{priceRange[0].toLocaleString()}</span>
              </div>
              <div className="text-gray-300 text-xs">—</div>
              <div className="flex-1 text-center bg-[#F8FAFC] border border-[#E5E7EB] rounded px-2 py-1">
                <span className="text-xs text-gray-500 block">Max</span>
                <span className="text-sm font-bold text-[#111827]">₹{priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* ── 4. Sizes ──────────────────────────────────────────────────── */}
      {sizes.length > 0 && (
        <div className="border-b border-[#E5E7EB] pb-4 pt-3">
          <Collapsible open={open.sizes} onOpenChange={() => toggle("sizes")}>
            <SectionHeader label="Size" sectionKey="sizes" count={selectedSizes.length} />
            <CollapsibleContent className="mt-3">
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const isSelected = selectedSizes.includes(size)
                  return (
                    <button
                      key={size}
                      onClick={() => toggleItem(selectedSizes, size, setSelectedSizes)}
                      className={`min-w-[40px] h-9 px-2.5 flex items-center justify-center text-xs font-semibold border rounded-sm transition-all duration-150 ${
                        isSelected
                          ? "bg-[#111827] text-white border-[#111827] shadow-sm"
                          : "border-[#E5E7EB] text-gray-600 hover:border-[#F38508] hover:text-[#F38508]"
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* ── 5. Colors ─────────────────────────────────────────────────── */}
      {colors.length > 0 && setSelectedColors && (
        <div className="border-b border-[#E5E7EB] pb-4 pt-3">
          <Collapsible open={open.colors} onOpenChange={() => toggle("colors")}>
            <SectionHeader label="Color" sectionKey="colors" count={selectedColors.length} />
            <CollapsibleContent className="mt-3">
              <div className="flex flex-wrap gap-2.5">
                {colors.map((color) => {
                  const { hex, label } = getColorInfo(color)
                  const isSelected = selectedColors.includes(color)
                  const isLight = ["white", "cream", "off_white", "beige", "mint", "lavender", "sand"].some(
                    l => color.toLowerCase().includes(l)
                  )
                  return (
                    <button
                      key={color}
                      title={label}
                      onClick={() => toggleItem(selectedColors, color, setSelectedColors)}
                      className={`relative w-7 h-7 rounded-full border-2 transition-all duration-150 hover:scale-110 focus:outline-none ${
                        isSelected
                          ? "border-[#F38508] scale-110 shadow-md"
                          : isLight
                          ? "border-gray-300"
                          : "border-transparent hover:border-gray-300"
                      }`}
                      style={{ backgroundColor: hex }}
                    >
                      {isSelected && (
                        <span
                          className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${
                            isLight ? "text-gray-700" : "text-white"
                          }`}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              {/* Selected color labels */}
              {selectedColors.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedColors.map(c => (
                    <span key={c} className="text-[11px] text-[#F38508] font-medium">
                      {getColorInfo(c).label}
                      {selectedColors.indexOf(c) < selectedColors.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* ── 6. Brands ─────────────────────────────────────────────────── */}
      {brands.length > 0 && setSelectedBrands && (
        <div className="border-b border-[#E5E7EB] pb-4 pt-3">
          <Collapsible open={open.brands} onOpenChange={() => toggle("brands")}>
            <SectionHeader label="Brand" sectionKey="brands" count={selectedBrands.length} />
            <CollapsibleContent className="mt-3 space-y-1.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center gap-2.5 cursor-pointer group py-0.5">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={() => toggleItem(selectedBrands, brand, setSelectedBrands)}
                    className="border-gray-300 rounded-[2px] data-[state=checked]:bg-[#F38508] data-[state=checked]:border-[#F38508]"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-[#111827] flex-1 transition-colors">
                    {brand}
                  </span>
                </label>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* ── 7. Rating ─────────────────────────────────────────────────── */}
      {setSelectedRating && (
        <div className="pb-4 pt-3">
          <Collapsible open={open.rating} onOpenChange={() => toggle("rating")}>
            <SectionHeader label="Customer Rating" sectionKey="rating" />
            <CollapsibleContent className="mt-3 space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSelectedRating(selectedRating === rating ? 0 : rating)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                    selectedRating === rating
                      ? "bg-[#F38508]/10 border border-[#F38508]/30"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < rating
                            ? "fill-[#F38508] text-[#F38508]"
                            : "text-gray-200 fill-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">& Above</span>
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  )
}
