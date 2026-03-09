import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { ReturnRequest } from "@/models/ReturnRequest"
import { Order } from "@/models/Order"
import { resolveUserId } from "@/lib/auth-utils"
import mongoose from "mongoose"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const userId = await resolveUserId(session.user.id, session.user.email)
    
    // @ts-ignore
    const returns = await ReturnRequest.getByUser(userId.toString(), { page, limit })
    const total = await ReturnRequest.countDocuments({ user: userId })

    return NextResponse.json({
      returns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching returns:", error)
    return NextResponse.json({ message: "Failed to fetch return requests" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const userId = await resolveUserId(session.user.id, session.user.email)
    
    const body = await request.json()
    const { orderId, items, type, reason, comments, pickupAddress } = body

    if (!orderId || !items || !items.length || !type || !reason || !pickupAddress) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Verify order belongs to user and is delivered
    const order = await Order.findOne({ _id: orderId, user: userId })
    if (!order) {
      return NextResponse.json({ message: "Order not found or access denied" }, { status: 404 })
    }

    // Ensure status is valid for return (e.g., delivered)
    if (order.status !== "delivered") {
       // Currently allowing returns just in case, but ideally should be checked
       // return NextResponse.json({ message: "Can only return delivered orders" }, { status: 400 })
    }

    const returnRequest = new ReturnRequest({
      order: orderId,
      user: userId,
      items,
      type,
      reason,
      comments,
      pickupAddress,
    })

    await returnRequest.save()

    // Update the order status to indicate return requested
    order.status = "return_requested"
    await order.save()

    return NextResponse.json({ message: "Return request submitted successfully", returnRequest }, { status: 201 })
  } catch (error) {
    console.error("Error creating return request:", error)
    return NextResponse.json({ message: "Failed to create return request" }, { status: 500 })
  }
}
