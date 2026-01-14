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

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const status = searchParams.get("status") // paid, pending, failed, refunded
        const method = searchParams.get("method") // razorpay, cod, etc.
        const dateFrom = searchParams.get("from")
        const dateTo = searchParams.get("to")

        const query: any = {}

        if (status) {
            query.paymentStatus = status
        }

        if (method) {
            query.paymentMethod = method
        }

        if (dateFrom || dateTo) {
            query.createdAt = {}
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom)
            if (dateTo) query.createdAt.$lte = new Date(dateTo)
        }

        const [payments, total, stats] = await Promise.all([
            Order.find(query)
                .select("orderNumber total paymentStatus paymentMethod paymentId createdAt user")
                .populate("user", "name email")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Order.countDocuments(query),
            Order.aggregate([
                {
                    $group: {
                        _id: "$paymentStatus",
                        count: { $sum: 1 },
                        total: { $sum: "$total" }
                    }
                }
            ])
        ])

        // Return payments array directly (frontend expects array)
        return NextResponse.json(payments.map(p => ({
            _id: p._id,
            orderId: p.orderNumber,
            customerName: (p.user as any)?.name || "Guest",
            customerEmail: (p.user as any)?.email || "",
            amount: p.total,
            status: p.paymentStatus,
            method: p.paymentMethod,
            transactionId: p.paymentId,
            createdAt: p.createdAt
        })))
    } catch (error) {
        console.error("Admin payments error:", error)
        return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
    }
}
