import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { Category } from "@/models/Category"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get all active products to extract available filter options
    const products = await Product.find({ isActive: true })
      .select("category brand variations.sizes price rating")
      .populate("category", "name")
      .lean()

    // Extract unique categories with counts
    const categoryMap = new Map<string, number>()
    products.forEach(p => {
      const catName = (p.category as any)?.name
      if (catName) {
        categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1)
      }
    })
    const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))

    // Extract unique brands
    const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))) as string[]

    // Extract unique sizes
    const sizesSet = new Set<string>()
    products.forEach(p => {
      p.variations?.sizes?.forEach((s: string) => sizesSet.add(s))
    })
    const sizes = Array.from(sizesSet).sort()

    // Calculate price range
    let minPrice = Infinity
    let maxPrice = -Infinity
    products.forEach(p => {
      if (p.price < minPrice) minPrice = p.price
      if (p.price > maxPrice) maxPrice = p.price
    })

    if (minPrice === Infinity) minPrice = 0
    if (maxPrice === -Infinity) maxPrice = 10000

    return NextResponse.json({
      categories,
      brands: brands.sort(),
      sizes,
      priceRange: {
        min: Math.floor(minPrice),
        max: Math.ceil(maxPrice)
      }
    })
  } catch (error) {
    console.error("Error fetching filters:", error)
    return NextResponse.json({ message: "Failed to fetch filters" }, { status: 500 })
  }
}
