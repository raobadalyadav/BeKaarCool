import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const role = searchParams.get("role")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const query: any = {}

    if (role && role !== "all") {
      query.role = role
    }

    if (status && status !== "all") {
      if (status === "active") query.isActive = true
      if (status === "inactive") query.isActive = false
      if (status === "verified") query.isVerified = true
      if (status === "unverified") query.isVerified = false
      if (status === "banned") query.isBanned = true
    }

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
    }

    const skip = (page - 1) * limit
    const total = await User.countDocuments(query)
    const users = await User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit)

    // Get stats
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ["$isActive", 1, 0] } },
          verified: { $sum: { $cond: ["$isVerified", 1, 0] } },
          banned: { $sum: { $cond: ["$isBanned", 1, 0] } },
          sellers: { $sum: { $cond: [{ $eq: ["$role", "seller"] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } },
        }
      }
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: stats[0] || { total: 0, active: 0, verified: 0, banned: 0, sellers: 0, admins: 0 }
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
