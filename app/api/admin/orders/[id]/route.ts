import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Await params before using
    const { id } = await params

    const order = await Order.findById(id)
      .populate("customer", "name email phone")
      .populate("items.product", "name images")
      .populate("statusHistory.by", "name")
      .select("+internalNotes")

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ message: "Failed to fetch order" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Await params before using
    const { id } = await params

    const body = await request.json()
    const { status, statusNote, internalNotes, ...otherUpdates } = body

    const order = await Order.findById(id)

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    // If status is being updated, use the updateStatus method for proper history tracking
    if (status && status !== order.status) {
      order.status = status
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        note: statusNote || undefined,
        by: session.user.id
      })
    }

    // Update internal notes if provided
    if (internalNotes !== undefined) {
      order.internalNotes = internalNotes
    }

    // Apply other updates
    Object.assign(order, otherUpdates)

    await order.save()

    // Re-fetch with populated fields
    const updatedOrder = await Order.findById(id)
      .populate("customer", "name email phone")
      .populate("items.product", "name images")
      .populate("statusHistory.by", "name")
      .select("+internalNotes")

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ message: "Failed to update order" }, { status: 500 })
  }
}

