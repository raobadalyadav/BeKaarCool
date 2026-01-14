import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { SupportTicket } from "@/models/SupportTicket"

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { id } = await params
        await connectDB()

        const ticket = await SupportTicket.findById(id)
            .populate("user", "name email")
            .populate("order", "orderNumber")
            .lean()

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
        }

        return NextResponse.json(ticket)
    } catch (error) {
        console.error("Admin support ticket fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { id } = await params
        await connectDB()

        const body = await request.json()
        const { status, priority, assignedTo } = body

        const updateData: any = {}
        if (status) updateData.status = status
        if (priority) updateData.priority = priority
        if (assignedTo) updateData.assignedTo = assignedTo

        const ticket = await SupportTicket.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        )

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
        }

        return NextResponse.json({ ticket, message: "Ticket updated" })
    } catch (error) {
        console.error("Admin support ticket update error:", error)
        return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
    }
}
