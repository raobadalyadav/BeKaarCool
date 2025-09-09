import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const users = await User.find({}).select("-password").sort({ createdAt: -1 })

    // Create CSV content
    const csvHeader = "Name,Email,Role,Status,Verified,Joined,Last Login\n"
    const csvContent = users
      .map(
        (user) =>
          `"${user.name}","${user.email}","${user.role}","${user.isActive ? "Active" : "Inactive"}","${user.isVerified ? "Yes" : "No"}","${new Date(user.createdAt).toLocaleDateString()}","${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}"`,
      )
      .join("\n")

    const csv = csvHeader + csvContent

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="users-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting users:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
