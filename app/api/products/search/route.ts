import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    if (!query || query.length < 2) {
      return NextResponse.json({ products: [], suggestions: [] })
    }

    // Enhanced search with multiple fields and scoring
    const searchFilter = {
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
            { category: { $regex: query, $options: "i" } },
            { subcategory: { $regex: query, $options: "i" } },
            { brand: { $regex: query, $options: "i" } },
            { tags: { $in: [new RegExp(query, "i")] } },
            { "seo.keywords": { $in: [new RegExp(query, "i")] } },
          ]
        }
      ]
    }

    // Get products with relevance scoring
    const products = await Product.aggregate([
      { $match: searchFilter },
      {
        $addFields: {
          relevanceScore: {
            $add: [
              // Name match gets highest score
              { $cond: [{ $regexMatch: { input: "$name", regex: query, options: "i" } }, 10, 0] },
              // Brand match gets high score
              { $cond: [{ $regexMatch: { input: "$brand", regex: query, options: "i" } }, 8, 0] },
              // Category match gets medium score
              { $cond: [{ $regexMatch: { input: "$category", regex: query, options: "i" } }, 6, 0] },
              // Featured products get bonus
              { $cond: ["$featured", 3, 0] },
              // Higher rating gets bonus
              { $multiply: ["$rating", 0.5] },
              // More sales get bonus
              { $multiply: [{ $log10: { $add: ["$sold", 1] } }, 0.3] }
            ]
          }
        }
      },
      { $sort: { relevanceScore: -1, rating: -1, sold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "seller",
          foreignField: "_id",
          as: "seller",
          pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }]
        }
      },
      { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } }
    ])

    // Generate search suggestions
    const suggestions = await generateSuggestions(query)

    return NextResponse.json({
      products,
      suggestions,
      total: products.length
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ message: "Search failed" }, { status: 500 })
  }
}

async function generateSuggestions(query: string): Promise<string[]> {
  try {
    const suggestions = new Set<string>()

    // Get category suggestions
    const categories = await Product.distinct("category", {
      category: { $regex: query, $options: "i" },
      isActive: true
    })
    categories.forEach(cat => suggestions.add(cat))

    // Get brand suggestions
    const brands = await Product.distinct("brand", {
      brand: { $regex: query, $options: "i" },
      isActive: true
    })
    brands.forEach(brand => brand && suggestions.add(brand))

    // Get popular product name suggestions
    const nameMatches = await Product.find(
      { 
        name: { $regex: query, $options: "i" },
        isActive: true 
      },
      { name: 1, sold: 1 }
    )
    .sort({ sold: -1 })
    .limit(5)

    nameMatches.forEach(product => {
      const words = product.name.split(' ')
      words.forEach(word => {
        if (word.toLowerCase().includes(query.toLowerCase()) && word.length > 2) {
          suggestions.add(word)
        }
      })
    })

    // Get tag suggestions
    const tagMatches = await Product.find(
      { 
        tags: { $in: [new RegExp(query, "i")] },
        isActive: true 
      },
      { tags: 1 }
    ).limit(10)

    tagMatches.forEach(product => {
      product.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(tag)
        }
      })
    })

    return Array.from(suggestions).slice(0, 8)
  } catch (error) {
    console.error("Error generating suggestions:", error)
    return []
  }
}