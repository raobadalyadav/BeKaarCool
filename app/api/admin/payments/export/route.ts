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

        const payments = await Order.find()
            .select("orderNumber total paymentStatus paymentMethod paymentId createdAt user")
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .lean()

        // Generate CSV
        const headers = ["Order ID", "Customer", "Email", "Amount", "Status", "Method", "Transaction ID", "Date"]
        const rows = payments.map(p => [
            p.orderNumber,
            (p.user as any)?.name || "Guest",
            (p.user as any)?.email || "",
            p.total,
            p.paymentStatus,
            p.paymentMethod,
            p.paymentId || "",
            new Date(p.createdAt).toISOString().split("T")[0]
        ])

        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename=payments-${Date.now()}.csv`
            }
        })
    } catch (error) {
        console.error("Admin payments export error:", error)
        return NextResponse.json({ error: "Failed to export" }, { status: 500 })
    }
}
