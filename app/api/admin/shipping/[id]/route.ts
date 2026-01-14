import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"

interface RouteParams {
    params: Promise<{ id: string }>
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
        const { status, trackingNumber, carrier } = body

        const updateData: any = {}
        if (status) updateData.status = status
        if (trackingNumber) updateData.trackingNumber = trackingNumber
        if (carrier) updateData.carrier = carrier
        if (status === "delivered") updateData.deliveredAt = new Date()

        const order = await Order.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        )

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

        return NextResponse.json({ order, message: "Shipment updated" })
    } catch (error) {
        console.error("Admin shipping update error:", error)
        return NextResponse.json({ error: "Failed to update shipment" }, { status: 500 })
    }
}
