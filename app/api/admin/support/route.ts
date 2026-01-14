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

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const status = searchParams.get("status") // open, in_progress, resolved, closed
        const priority = searchParams.get("priority") // low, medium, high, urgent

        const query: any = {}

        if (status) query.status = status
        if (priority) query.priority = priority

        const [tickets, total, statusCounts] = await Promise.all([
            SupportTicket.find(query)
                .populate("user", "name email")
                .populate("order", "orderNumber")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            SupportTicket.countDocuments(query),
            SupportTicket.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ])
        ])

        // Return tickets array directly (frontend expects array)
        return NextResponse.json(tickets.map(t => ({
            _id: t._id,
            ticketId: t.ticketNumber || `TKT-${(t._id as any).toString().slice(-6).toUpperCase()}`,
            subject: t.subject,
            description: t.messages?.[0]?.message || "",
            status: t.status,
            priority: t.priority || "medium",
            category: t.category || "other",
            customerName: (t.user as any)?.name || "Guest",
            customerEmail: (t.user as any)?.email || "",
            assignedTo: t.assignedTo?.toString() || "",
            createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
            messages: (t.messages || []).map((r: any) => ({
                sender: r.sender === "support" ? "Admin" : (t.user as any)?.name || "Customer",
                message: r.message,
                timestamp: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
                isAdmin: r.sender === "support"
            }))
        })))
    } catch (error) {
        console.error("Admin support error:", error)
        return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        const body = await request.json()
        const { ticketId, status, priority, reply } = body

        if (!ticketId) {
            return NextResponse.json({ error: "Ticket ID required" }, { status: 400 })
        }

        const updateData: any = {}
        if (status) updateData.status = status
        if (priority) updateData.priority = priority

        const updateOps: any = { $set: updateData }

        // Add reply if provided
        if (reply) {
            updateOps.$push = {
                replies: {
                    message: reply,
                    isAdmin: true,
                    createdAt: new Date()
                }
            }
        }

        const ticket = await SupportTicket.findByIdAndUpdate(
            ticketId,
            updateOps,
            { new: true }
        )

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
        }

        return NextResponse.json({ message: "Ticket updated", ticket })
    } catch (error) {
        console.error("Admin support update error:", error)
        return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
    }
}
