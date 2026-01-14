import { type NextRequest, NextResponse } from "next/server"
import { ShippingProvider, trackShipment } from "@/lib/shipping"

export async function GET(
    request: NextRequest,
    { params }: { params: { awb: string } }
) {
    try {
        const awb = params.awb
        const { searchParams } = new URL(request.url)
        const provider = (searchParams.get("provider") || "shiprocket") as ShippingProvider

        if (!awb) {
            return NextResponse.json({ error: "AWB number required" }, { status: 400 })
        }

        const result = await trackShipment(provider, awb)

        if (result.success) {
            return NextResponse.json({
                success: true,
                tracking: {
                    awbNumber: result.awbNumber,
                    status: result.status,
                    statusCode: result.statusCode,
                    currentLocation: result.currentLocation,
                    expectedDelivery: result.expectedDelivery,
                    events: result.events
                }
            })
        }

        return NextResponse.json({
            success: false,
            error: result.error || "Unable to fetch tracking details"
        }, { status: 404 })
    } catch (error: any) {
        console.error("Shipment tracking error:", error)
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to track shipment"
        }, { status: 500 })
    }
}
