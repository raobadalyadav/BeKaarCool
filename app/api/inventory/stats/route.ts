import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const totalProducts = await Product.countDocuments({})
    const lowStockItems = await Product.countDocuments({ stock: { $lte: 10 } })
    const outOfStockItems = await Product.countDocuments({ stock: 0 })

    const products = await Product.find({}).select("price stock")
    const totalValue = products.reduce((sum, product) => sum + product.price * product.stock, 0)

    return NextResponse.json({
      totalProducts,
      lowStockItems,
      outOfStockItems,
      totalValue,
    })
  } catch (error) {
    console.error("Error fetching inventory stats:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
