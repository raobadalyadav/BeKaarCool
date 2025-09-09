import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const categories = await Product.distinct("category", { isActive: true })

    // Get category counts
    const categoryCounts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    const categoriesWithCounts = categories.map((category) => {
      const countData = categoryCounts.find((c) => c._id === category)
      return {
        name: category,
        count: countData ? countData.count : 0,
      }
    })

    return NextResponse.json(categoriesWithCounts)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ message: "Failed to fetch categories" }, { status: 500 })
  }
}
