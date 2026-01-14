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

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const search = searchParams.get("search")
        const status = searchParams.get("status")

        const query: any = { role: "seller" }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ]
        }
        if (status) query.isActive = status === "active"

        const [sellers, total] = await Promise.all([
            User.find(query)
                .select("name email phone isActive createdAt businessName gstNumber")
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments(query)
        ])

        return NextResponse.json({
            sellers,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        })
    } catch (error) {
        console.error("Admin sellers error:", error)
        return NextResponse.json({ error: "Failed to fetch sellers" }, { status: 500 })
    }
}
