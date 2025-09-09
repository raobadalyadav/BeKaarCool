import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"

export async function GET() {
  try {
    await connectDB()

    const products = await Product.find({
      isActive: true,
      featured: true,
    })
      .limit(6)
      .sort({ createdAt: -1 })
      .populate("seller", "name email")

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching featured products:", error)
    return NextResponse.json({ error: "Failed to fetch featured products" }, { status: 500 })
  }
}
