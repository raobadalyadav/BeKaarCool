"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, X, Filter, Star } from "lucide-react"

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
    brands: false,
    rating: false
  })

  const categories = [
    { name: "T-Shirts", count: 245 },
    { name: "Hoodies", count: 128 },
    { name: "Accessories", count: 89 },
    { name: "Mugs", count: 156 },
    { name: "Posters", count: 203 },
    { name: "Phone Cases", count: 67 },
    { name: "Stickers", count: 134 }
  ]

  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "One Size"]
  const brands = ["Nike", "Adidas", "Custom Co.", "Print Pro", "Design Hub", "Creative Wear"]
  const ratings = [5, 4, 3, 2, 1]

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
    <Card className={`p-6 sticky top-24 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Categories */}
        <Collapsible open={openSections.categories} onOpenChange={() => toggleSection('categories')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h3 className="font-semibold">Categories</h3>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.categories ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {categories.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={category.name}
                    checked={selectedCategories.includes(category.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCategories([...selectedCategories, category.name])
                      } else {
                        setSelectedCategories(selectedCategories.filter((c) => c !== category.name))
                      }
                    }}
                  />
                  <label htmlFor={category.name} className="text-sm font-medium cursor-pointer">
                    {category.name}
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">({category.count})</span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Price Range */}
        <Collapsible open={openSections.price} onOpenChange={() => toggleSection('price')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h3 className="font-semibold">Price Range</h3>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.price ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-3">
            <Slider 
              value={priceRange} 
              onValueChange={setPriceRange} 
              max={5000} 
              min={0} 
              step={100} 
              className="w-full" 
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>₹{priceRange[0]}</span>
              <span>₹{priceRange[1]}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Under ₹500", range: [0, 500] },
                { label: "₹500-₹1000", range: [500, 1000] },
                { label: "₹1000-₹2000", range: [1000, 2000] },
                { label: "Above ₹2000", range: [2000, 5000] }
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setPriceRange(preset.range)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Sizes */}
        <Collapsible open={openSections.sizes} onOpenChange={() => toggleSection('sizes')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h3 className="font-semibold">Sizes</h3>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.sizes ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="grid grid-cols-3 gap-2">
              {sizes.map((size) => (
                <Button
                  key={size}
                  variant={selectedSizes.includes(size) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (selectedSizes.includes(size)) {
                      setSelectedSizes(selectedSizes.filter((s) => s !== size))
                    } else {
                      setSelectedSizes([...selectedSizes, size])
                    }
                  }}
                  className="text-xs"
                >
                  {size}
                </Button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Brands */}
        {setSelectedBrands && (
          <>
            <Separator />
            <Collapsible open={openSections.brands} onOpenChange={() => toggleSection('brands')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h3 className="font-semibold">Brands</h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.brands ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-3">
                {brands.map((brand) => (
                  <div key={brand} className="flex items-center space-x-2">
                    <Checkbox
                      id={brand}
                      checked={selectedBrands.includes(brand)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedBrands([...selectedBrands, brand])
                        } else {
                          setSelectedBrands(selectedBrands.filter((b) => b !== brand))
                        }
                      }}
                    />
                    <label htmlFor={brand} className="text-sm font-medium cursor-pointer">
                      {brand}
                    </label>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {/* Rating */}
        {setSelectedRating && (
          <>
            <Separator />
            <Collapsible open={openSections.rating} onOpenChange={() => toggleSection('rating')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h3 className="font-semibold">Rating</h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.rating ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-3">
                {ratings.map((rating) => (
                  <div
                    key={rating}
                    onClick={() => setSelectedRating(selectedRating === rating ? 0 : rating)}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded"
                  >
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm">& up</span>
                    {selectedRating === rating && (
                      <Badge variant="default" className="ml-auto">
                        Selected
                      </Badge>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </div>
    </Card>
  )
}