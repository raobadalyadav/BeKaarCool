import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const warehouse = searchParams.get("warehouse")

    const skip = (page - 1) * limit
    const filter: any = {}

    // If seller, only show their products
    if (session.user.role === "seller") {
      filter.seller = session.user.id
    }

    if (category && category !== "all") {
      filter.category = category
    }

    if (status) {
      switch (status) {
        case "low-stock":
          filter.stock = { $lte: 10 }
          break
        case "out-of-stock":
          filter.stock = 0
          break
        case "in-stock":
          filter.stock = { $gt: 0 }
          break
      }
    }

    const products = await Product.find(filter)
      .select("name sku stock reorderLevel maxStock price")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)

    const total = await Product.countDocuments(filter)

    const inventory = products.map((product) => ({
      _id: product._id,
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      currentStock: product.stock,
      reservedStock: 0, // This would come from pending orders
      availableStock: product.stock,
      reorderLevel: product.reorderLevel || 10,
      maxStock: product.maxStock || 1000,
      location: "Main Warehouse",
      lastUpdated: product.updatedAt,
    }))

    return NextResponse.json({
      inventory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ message: "Failed to fetch inventory" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "admin" && session.user.role !== "seller")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { productId, stock } = await request.json()

    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check if user owns the product or is admin
    if (product.seller.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updatedProduct = await Product.findByIdAndUpdate(productId, { stock }, { new: true })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("Error updating inventory:", error)
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 })
  }
}
