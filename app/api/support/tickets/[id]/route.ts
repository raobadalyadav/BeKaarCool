import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { SupportTicket } from "@/models/SupportTicket"
import { resolveUserId } from "@/lib/auth-utils"

// GET: Get single ticket details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)
        const { id } = await (params as any)

        const ticket = await SupportTicket.findOne({ _id: id, user: userId })
            .populate("orderId", "orderNumber total status")
            .lean()

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
        }

        return NextResponse.json({ ticket })
    } catch (error: any) {
        console.error("Ticket fetch error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: Add message to ticket
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)
        const { id } = await (params as any)
        const { message, attachments } = await request.json()

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 })
        }

        const ticket = await SupportTicket.findOne({ _id: id, user: userId })

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
        }

        if (ticket.status === "closed") {
            return NextResponse.json({ error: "Cannot reply to closed ticket" }, { status: 400 })
        }

        ticket.messages.push({
            sender: "customer",
            message,
            attachments: attachments || [],
            createdAt: new Date()
        })

        // If ticket was waiting for customer, update status
        if (ticket.status === "waiting_customer") {
            ticket.status = "in_progress"
        }

        await ticket.save()

        return NextResponse.json({
            message: "Reply added successfully",
            ticket: {
                _id: ticket._id,
                status: ticket.status,
                messages: ticket.messages
            }
        })
    } catch (error: any) {
        console.error("Ticket reply error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT: Close ticket
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)
        const { id } = await (params as any)
        const { action } = await request.json()

        const ticket = await SupportTicket.findOne({ _id: id, user: userId })

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
        }

        if (action === "close") {
            ticket.status = "closed"
            ticket.resolvedAt = new Date()
            await ticket.save()

            return NextResponse.json({ message: "Ticket closed successfully" })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    } catch (error: any) {
        console.error("Ticket update error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
