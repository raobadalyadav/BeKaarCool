import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"
import { Order } from "@/models/Order"
import { Address } from "@/models/Address"

// GET single user with details (orders, addresses)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { id } = await params
    const user = await User.findById(id).select("-password")

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Get user's recent orders (last 10)
    const orders = await Order.find({ customer: id })
      .select("orderNumber status paymentStatus totalAmount createdAt items")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    // Get user's addresses
    const addresses = await Address.find({ user: id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean()

    return NextResponse.json({
      user,
      orders,
      addresses,
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// PUT update user (role, status, ban/unban)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { id } = await params
    const body = await request.json()
    const { isActive, role, isVerified, isBanned, banReason } = body

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Handle ban/unban
    if (typeof isBanned === "boolean") {
      if (isBanned) {
        await user.ban(banReason || "No reason provided")
      } else {
        await user.unban()
      }
    }

    // Update other fields
    const updateFields: any = {}
    if (typeof isActive === "boolean") updateFields.isActive = isActive
    if (role) updateFields.role = role
    if (typeof isVerified === "boolean") updateFields.isVerified = isVerified

    if (Object.keys(updateFields).length > 0) {
      await User.findByIdAndUpdate(id, updateFields)
    }

    // Fetch updated user
    const updatedUser = await User.findById(id).select("-password")

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { id } = await params
    const user = await User.findByIdAndDelete(id)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
