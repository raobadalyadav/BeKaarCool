import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"

export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const orderNumber = searchParams.get("orderNumber")
        const trackingId = searchParams.get("trackingId")
        const email = searchParams.get("email")

        if (!orderNumber && !trackingId) {
            return NextResponse.json(
                { error: "Order number or tracking ID is required" },
                { status: 400 }
            )
        }

        // Build query
        const query: any = {}

        if (orderNumber) {
            query.orderNumber = { $regex: new RegExp(`^${orderNumber}$`, "i") }
        }

        if (trackingId) {
            query.$or = [
                { orderNumber: { $regex: new RegExp(`^${trackingId}$`, "i") } },
                { "tracking.trackingNumber": { $regex: new RegExp(`^${trackingId}$`, "i") } }
            ]
        }

        // Find order
        const order = await Order.findOne(query)
            .populate("items.product", "name images price slug")
            .lean()

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            )
        }

        // Return sanitized order data (no sensitive info)
        const sanitizedOrder = {
            orderNumber: order.orderNumber,
            status: order.status,
            estimatedDelivery: order.estimatedDelivery,
            createdAt: order.createdAt,
            items: order.items?.map((item: any) => ({
                name: item.product?.name || item.name,
                quantity: item.quantity,
                price: item.price,
                size: item.size,
                color: item.color,
                product: item.product ? {
                    name: item.product.name,
                    images: item.product.images,
                    slug: item.product.slug
                } : null
            })),
            total: order.total || order.totalAmount,
            shippingAddress: order.shippingAddress ? {
                name: order.shippingAddress.name,
                address: order.shippingAddress.address || order.shippingAddress.street,
                city: order.shippingAddress.city,
                state: order.shippingAddress.state,
                pincode: order.shippingAddress.pincode || order.shippingAddress.zipCode
            } : null,
            tracking: order.tracking || {
                trackingNumber: order.orderNumber,
                carrier: "BeKaarCool Logistics",
                currentLocation: getLocationFromStatus(order.status)
            },
            statusHistory: order.statusHistory || generateStatusHistory(order)
        }

        return NextResponse.json({ order: sanitizedOrder })
    } catch (error) {
        console.error("Error tracking order:", error)
        return NextResponse.json(
            { error: "Failed to track order" },
            { status: 500 }
        )
    }
}

function getLocationFromStatus(status: string): string {
    const locations: Record<string, string> = {
        'pending': 'Order Processing',
        'confirmed': 'BeKaarCool Warehouse',
        'processing': 'Packaging Center',
        'shipped': 'In Transit',
        'out_for_delivery': 'Local Delivery Hub',
        'delivered': 'Delivered'
    }
    return locations[status.toLowerCase()] || 'Processing'
}

function generateStatusHistory(order: any) {
    const history = []
    const baseDate = new Date(order.createdAt)

    // Add order placed
    history.push({
        status: 'Pending',
        timestamp: baseDate,
        location: 'Order Placed'
    })

    // Add more statuses based on current status
    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered']
    const currentIndex = statuses.indexOf(order.status.toLowerCase())

    for (let i = 1; i <= currentIndex; i++) {
        const timestamp = new Date(baseDate)
        timestamp.setHours(timestamp.getHours() + (i * 12)) // Add 12 hours for each status

        history.push({
            status: statuses[i].charAt(0).toUpperCase() + statuses[i].slice(1).replace('_', ' '),
            timestamp,
            location: getLocationFromStatus(statuses[i])
        })
    }

    return history
}
