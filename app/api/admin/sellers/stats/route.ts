import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        const [total, active, pending] = await Promise.all([
            User.countDocuments({ role: "seller" }),
            User.countDocuments({ role: "seller", isActive: true }),
            User.countDocuments({ role: "seller", isActive: false })
        ])

        return NextResponse.json({
            totalSellers: total,
            activeSellers: active,
            pendingSellers: pending,
            rejectedSellers: 0
        })
    } catch (error) {
        console.error("Admin sellers stats error:", error)
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }
}
