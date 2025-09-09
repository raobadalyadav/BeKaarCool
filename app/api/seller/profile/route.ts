import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"
import { Product } from "@/models/Product"
import { Order } from "@/models/Order"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Get user profile
    const user = await User.findById(session.user.id).select("name email phone avatar createdAt")
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get seller's products
    const products = await Product.find({ seller: session.user.id })
    const productIds = products.map(p => p._id)

    // Get orders containing seller's products
    const orders = await Order.find({
      "items.product": { $in: productIds },
      paymentStatus: "paid"
    }).populate("items.product")

    // Calculate stats
    let totalRevenue = 0
    let totalSales = 0

    orders.forEach(order => {
      order.items.forEach(item => {
        if (productIds.some(id => id.toString() === item.product._id.toString())) {
          totalRevenue += item.price * item.quantity
          totalSales += item.quantity
        }
      })
    })

    const profile = {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      avatar: user.avatar || "",
      bio: "", // Add bio field to User model if needed
      joinDate: user.createdAt,
      rating: 4.5, // Mock rating - implement proper rating system
      totalProducts: products.length,
      totalSales,
      totalRevenue,
      location: "", // Add location field if needed
      verified: true // Mock verification status
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, avatar, bio, location } = body

    await connectDB()

    // Update user profile
    const updateData: any = {}
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (avatar) updateData.avatar = avatar
    // Add bio and location to User model if needed

    await User.findByIdAndUpdate(session.user.id, updateData)

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}