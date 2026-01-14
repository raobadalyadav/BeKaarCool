import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { SupportTicket } from "@/models/SupportTicket"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        const stats = await SupportTicket.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ])

        const result = {
            totalTickets: 0,
            openTickets: 0,
            inProgressTickets: 0,
            resolvedTickets: 0
        }

        stats.forEach(s => {
            result.totalTickets += s.count
            if (s._id === "open") result.openTickets = s.count
            else if (s._id === "in_progress") result.inProgressTickets = s.count
            else if (s._id === "resolved") result.resolvedTickets = s.count
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error("Admin support stats error:", error)
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }
}
