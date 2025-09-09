import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { SupportTicket } from "@/models/SupportTicket"
import { User } from "@/models/User"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendSupportTicketEmail } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")

    const filter: any = {}

    // Regular users can only see their own tickets
    if (session.user.role === "customer") {
      filter.user = session.user.id
    }

    if (status && status !== "all") filter.status = status
    if (priority && priority !== "all") filter.priority = priority

    const tickets = await SupportTicket.find(filter).populate("user", "name email").sort({ createdAt: -1 })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Error fetching support tickets:", error)
    return NextResponse.json({ error: "Failed to fetch support tickets" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { subject, description, category, priority = "medium" } = await request.json()

    const ticket = new SupportTicket({
      user: session.user.id,
      subject,
      description,
      category,
      priority,
      status: "open",
    })

    await ticket.save()
    await ticket.populate("user", "name email")

    // Send notification email to support team
    await sendSupportTicketEmail(ticket)

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error("Error creating support ticket:", error)
    return NextResponse.json({ error: "Failed to create support ticket" }, { status: 500 })
  }
}
