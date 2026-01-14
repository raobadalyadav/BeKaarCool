import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        const stats = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ])

        const result = {
            totalShipments: 0,
            pendingShipments: 0,
            inTransitShipments: 0,
            deliveredShipments: 0
        }

        stats.forEach(s => {
            result.totalShipments += s.count
            if (s._id === "pending" || s._id === "confirmed" || s._id === "processing") {
                result.pendingShipments += s.count
            } else if (s._id === "shipped") {
                result.inTransitShipments += s.count
            } else if (s._id === "delivered") {
                result.deliveredShipments += s.count
            }
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error("Admin shipping stats error:", error)
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }
}
