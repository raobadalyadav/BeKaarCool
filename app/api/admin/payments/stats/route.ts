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
            {
                $group: {
                    _id: "$paymentStatus",
                    count: { $sum: 1 },
                    total: { $sum: "$total" }
                }
            }
        ])

        const result = {
            totalRevenue: 0,
            pendingPayments: 0,
            completedPayments: 0,
            failedPayments: 0
        }

        stats.forEach(s => {
            if (s._id === "paid") {
                result.totalRevenue = s.total
                result.completedPayments = s.count
            } else if (s._id === "pending") {
                result.pendingPayments = s.count
            } else if (s._id === "failed") {
                result.failedPayments = s.count
            }
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error("Admin payment stats error:", error)
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }
}
