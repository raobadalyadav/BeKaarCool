import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    
    // Await params before using
    const { productId } = await params
    
    const { quantity, type } = await request.json()

    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    let newStock = product.stock
    if (type === "add") {
      newStock += quantity
    } else if (type === "remove") {
      newStock = Math.max(0, newStock - quantity)
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { stock: newStock, updatedAt: new Date() },
      { new: true },
    )

    return NextResponse.json({
      _id: updatedProduct._id,
      productId: updatedProduct._id,
      productName: updatedProduct.name,
      sku: updatedProduct.sku,
      currentStock: updatedProduct.stock,
      reservedStock: 0,
      availableStock: updatedProduct.stock,
      reorderLevel: updatedProduct.reorderLevel || 10,
      maxStock: updatedProduct.maxStock || 1000,
      location: "Main Warehouse",
      lastUpdated: updatedProduct.updatedAt,
    })
  } catch (error) {
    console.error("Error updating stock:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
