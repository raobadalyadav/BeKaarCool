import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { SupportTicket } from "@/models/SupportTicket"

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { id } = await params
        await connectDB()

        const body = await request.json()
        const { message } = body

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 })
        }

        const ticket = await SupportTicket.findByIdAndUpdate(
            id,
            {
                $push: {
                    replies: {
                        message,
                        isAdmin: true,
                        sender: (session.user as any).name || "Admin",
                        createdAt: new Date()
                    }
                },
                $set: { updatedAt: new Date() }
            },
            { new: true }
        )

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
        }

        return NextResponse.json(ticket)
    } catch (error) {
        console.error("Admin support reply error:", error)
        return NextResponse.json({ error: "Failed to send reply" }, { status: 500 })
    }
}
