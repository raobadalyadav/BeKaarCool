
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Seller } from "@/models/Seller"
import { User } from "@/models/User"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Find Seller by User ID
    const seller = await Seller.findOne({ user: session.user.id })
    const user = await User.findById(session.user.id).select("name email phone avatar createdAt")

    if (!seller) {
      // Fallback for user who has role seller but no seller profile yet (legacy or incomplete reg)
      // Can return basic user info or 404
      if (user) {
        return NextResponse.json({
          profile: {
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            joinDate: user.createdAt,
            isIncomplete: true
          }
        })
      }
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 })
    }

    // Combine data
    const profile = {
      // Personal
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      avatar: user?.avatar,
      joinDate: user?.createdAt,

      // Business
      businessName: seller.businessName,
      businessType: seller.businessType,
      businessDescription: seller.businessDescription,
      businessAddress: seller.businessAddress,

      // Stats
      rating: seller.rating,
      totalProducts: seller.totalProducts,
      totalSales: seller.totalOrders, // Using totalOrders as sales count proxy or use ordersDelivered
      totalRevenue: seller.totalEarnings, // totalEarnings tracks actual earnings

      // Verification
      status: seller.status,
      isVerified: seller.isVerified,
      documents: seller.documents,

      // Bank
      bankDetails: seller.bankDetails
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
    // Separate User fields and Seller fields
    const { name, phone, avatar, businessName, businessDescription, businessAddress } = body

    await connectDB()

    // Update User Info
    if (name || phone || avatar) {
      const userUpdate: any = {}
      if (name) userUpdate.name = name
      if (phone) userUpdate.phone = phone
      if (avatar) userUpdate.avatar = avatar
      await User.findByIdAndUpdate(session.user.id, userUpdate)
    }

    // Update Seller Info
    // Note: Sensitive fields like GST/PAN/Bank usually require re-verification or separate process.
    // Allowing update of basic business info here.
    if (businessName || businessDescription || businessAddress) {
      const sellerUpdate: any = {}
      if (businessName) sellerUpdate.businessName = businessName
      if (businessDescription) sellerUpdate.businessDescription = businessDescription
      if (businessAddress) sellerUpdate.businessAddress = businessAddress // Assumes full address object or merged partial? Mongoose merge is shallow, be careful.

      await Seller.findOneAndUpdate({ user: session.user.id }, sellerUpdate)
    }

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}