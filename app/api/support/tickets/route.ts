import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { SupportTicket } from "@/models/SupportTicket"
import { resolveUserId } from "@/lib/auth-utils"

// GET: List user's support tickets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const userId = await resolveUserId(session.user.id, session.user.email)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")

    const skip = (page - 1) * limit
    const filter: any = { user: userId }

    if (status && status !== "all") {
      filter.status = status
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("orderId", "orderNumber total")
        .lean(),
      SupportTicket.countDocuments(filter)
    ])

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error("Support tickets fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Create new support ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const userId = await resolveUserId(session.user.id, session.user.email)
    const body = await request.json()

    const { subject, category, message, orderId, priority } = body

    if (!subject || !category || !message) {
      return NextResponse.json({
        error: "Subject, category, and message are required"
      }, { status: 400 })
    }

    const ticket = await SupportTicket.create({
      user: userId,
      subject,
      category,
      priority: priority || "medium",
      orderId: orderId || undefined,
      messages: [{
        sender: "customer",
        message,
        createdAt: new Date()
      }]
    })

    return NextResponse.json({
      message: "Ticket created successfully",
      ticket: {
        _id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error("Support ticket creation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
