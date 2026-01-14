"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Filter, Star } from "lucide-react"

interface SearchFiltersProps {
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  selectedSizes: string[]
  setSelectedSizes: (sizes: string[]) => void
  priceRange: number[]
  setPriceRange: (range: number[]) => void
  selectedBrands?: string[]
  setSelectedBrands?: (brands: string[]) => void
  selectedRating?: number
  setSelectedRating?: (rating: number) => void
  className?: string
}

export function SearchFilters({
  selectedCategories,
  setSelectedCategories,
  selectedSizes,
  setSelectedSizes,
  priceRange,
  setPriceRange,
  selectedBrands = [],
  setSelectedBrands,
  selectedRating,
  setSelectedRating,
  className
}: SearchFiltersProps) {
  const [openSections, setOpenSections] = useState({
    categories: true,
    price: true,
    sizes: true,
    brands: true,
    rating: false
  })

  // Dummy data - ideally from API
  const categories = [
    { name: "T-Shirts", count: 245 },
    { name: "Hoodies", count: 128 },
    { name: "Accessories", count: 89 },
    { name: "Mugs", count: 156 },
    { name: "Phone Cases", count: 67 },
  ]

  const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"]
  const brands = ["Nike", "Adidas", "Puma", "BeKaarCool", "Zara", "H&M"]
  const ratings = [4, 3, 2, 1]

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedSizes([])
    setPriceRange([0, 5000])
    if (setSelectedBrands) setSelectedBrands([])
    if (setSelectedRating) setSelectedRating(0)
  }

  const hasActiveFilters = selectedCategories.length > 0 ||
    selectedSizes.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 5000 ||
    selectedBrands.length > 0 ||
    (selectedRating && selectedRating > 0)

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between pb-4 border-b">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 uppercase"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="border-b pb-4">
        <Collapsible open={openSections.categories} onOpenChange={() => toggleSection('categories')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <h3 className="font-semibold text-gray-800 text-sm">Category</h3>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openSections.categories ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-2">
            {categories.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <Checkbox
                  id={`cat-${cat.name}`}
                  checked={selectedCategories.includes(cat.name)}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedCategories([...selectedCategories, cat.name])
                    else setSelectedCategories(selectedCategories.filter(c => c !== cat.name))
                  }}
                  className="border-gray-300 rounded-[2px] data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400 data-[state=checked]:text-black"
                />
                <label htmlFor={`cat-${cat.name}`} className="text-sm text-gray-600 cursor-pointer flex-1 flex justify-between">
                  <span>{cat.name}</span>
                  <span className="text-gray-400 text-xs">({cat.count})</span>
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Price */}
      <div className="border-b pb-4">
        <Collapsible open={openSections.price} onOpenChange={() => toggleSection('price')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h3 className="font-semibold text-gray-800 text-sm">Price</h3>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openSections.price ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={5000}
              min={0}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
              <span className="bg-gray-100 px-2 py-1 rounded">₹{priceRange[0]}</span>
              <span className="text-gray-300">to</span>
              <span className="bg-gray-100 px-2 py-1 rounded">₹{priceRange[1]}</span>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Sizes */}
      <div className="border-b pb-4">
        <Collapsible open={openSections.sizes} onOpenChange={() => toggleSection('sizes')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h3 className="font-semibold text-gray-800 text-sm">Sizes</h3>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openSections.sizes ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    if (selectedSizes.includes(size)) setSelectedSizes(selectedSizes.filter(s => s !== size))
                    else setSelectedSizes([...selectedSizes, size])
                  }}
                  className={`w-10 h-10 flex items-center justify-center text-xs border rounded-sm transition-colors ${selectedSizes.includes(size) ? 'border-black bg-white font-bold' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Brands */}
      {setSelectedBrands && (
        <div className="border-b pb-4">
          <Collapsible open={openSections.brands} onOpenChange={() => toggleSection('brands')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h3 className="font-semibold text-gray-800 text-sm">Brand</h3>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openSections.brands ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {brands.map((brand) => (
                <div key={brand} className="flex items-center gap-3">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedBrands([...selectedBrands, brand])
                      else setSelectedBrands(selectedBrands.filter(b => b !== brand))
                    }}
                    className="border-gray-300 rounded-[2px] data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400 data-[state=checked]:text-black"
                  />
                  <label htmlFor={`brand-${brand}`} className="text-sm text-gray-600 cursor-pointer">
                    {brand}
                  </label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Rating */}
      {setSelectedRating && (
        <div className="pb-4">
          <Collapsible open={openSections.rating} onOpenChange={() => toggleSection('rating')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h3 className="font-semibold text-gray-800 text-sm">Ratings</h3>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openSections.rating ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-2">
              {ratings.map((rating) => (
                <div key={rating} className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedRating(selectedRating === rating ? 0 : rating)}>
                  <Checkbox
                    id={`rating-${rating}`}
                    checked={selectedRating === rating}
                    onCheckedChange={() => setSelectedRating(selectedRating === rating ? 0 : rating)}
                    className="border-gray-300 rounded-[2px] data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400 data-[state=checked]:text-black"
                  />
                  <label htmlFor={`rating-${rating}`} className="text-sm text-gray-600 cursor-pointer flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">& Above</span>
                  </label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

    </div>
  )
}
