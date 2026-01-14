import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import DelhiveryService from "@/lib/delhivery"
import { resolveUserId } from "@/lib/auth-utils"

// POST: Create shipment for order
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const { orderId } = await request.json()

        if (!orderId) {
            return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
        }

        // Get order details
        const order = await Order.findById(orderId)
            .populate("items.product", "name sku weight")

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

        // Check if already shipped
        if (order.trackingNumber) {
            return NextResponse.json({
                error: "Shipment already created",
                awbNumber: order.trackingNumber
            }, { status: 400 })
        }

        // Create shipment with Delhivery
        const shipmentResult = await DelhiveryService.createShipment({
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            customer: {
                name: order.shippingAddress.fullName,
                phone: order.shippingAddress.phone,
                address: `${order.shippingAddress.addressLine1}, ${order.shippingAddress.addressLine2 || ""}`,
                city: order.shippingAddress.city,
                state: order.shippingAddress.state,
                pincode: order.shippingAddress.pincode,
                country: "India"
            },
            items: order.items.map((item: any) => ({
                name: item.product?.name || item.name,
                sku: item.product?.sku || `SKU-${item.product?._id}`,
                quantity: item.quantity,
                price: item.price
            })),
            totalWeight: order.items.reduce((w: number, i: any) => w + (i.product?.weight || 0.5) * i.quantity, 0.5),
            paymentMode: order.paymentMethod === "cod" ? "cod" : "prepaid",
            codAmount: order.paymentMethod === "cod" ? order.total : 0,
            invoiceValue: order.total
        })

        if (!shipmentResult.success) {
            return NextResponse.json({
                error: shipmentResult.error || "Failed to create shipment"
            }, { status: 500 })
        }

        // Update order with tracking info
        order.trackingNumber = shipmentResult.awbNumber
        order.carrier = "delhivery"
        order.status = "shipped"
        await order.save()

        return NextResponse.json({
            success: true,
            awbNumber: shipmentResult.awbNumber,
            trackingUrl: DelhiveryService.getTrackingUrl(shipmentResult.awbNumber!)
        })
    } catch (error: any) {
        console.error("Create shipment error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET: Check serviceability
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const pincode = searchParams.get("pincode")

        if (!pincode || !/^\d{6}$/.test(pincode)) {
            return NextResponse.json({ error: "Valid 6-digit pincode required" }, { status: 400 })
        }

        const result = await DelhiveryService.checkServiceability(pincode)

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("Serviceability check error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
