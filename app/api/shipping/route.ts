import { type NextRequest, NextResponse } from "next/server"
import {
    ShippingProvider,
    checkDelhiveryServiceability,
    trackShipment,
    createShipment
} from "@/lib/shipping"

// GET: Check serviceability for a pincode
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const pincode = searchParams.get("pincode")
        const provider = (searchParams.get("provider") || "shiprocket") as ShippingProvider

        if (!pincode) {
            return NextResponse.json({ error: "Pincode is required" }, { status: 400 })
        }

        // For now, we use Delhivery for serviceability check
        // In production, you can check multiple providers
        const result = await checkDelhiveryServiceability(pincode)

        // Also check if pincode is serviceable (basic validation)
        const isServiceable = /^[1-9][0-9]{5}$/.test(pincode)

        return NextResponse.json({
            serviceable: isServiceable && (result.available !== false),
            provider,
            estimatedDays: result.estimatedDays || 5,
            codAvailable: result.codAvailable !== false,
            shippingCharge: 49, // Default charge, can be 0 for orders above threshold
            freeShippingThreshold: 599
        })
    } catch (error: any) {
        console.error("Serviceability check error:", error)
        // Return default values on error
        return NextResponse.json({
            serviceable: true,
            provider: "shiprocket",
            estimatedDays: 5,
            codAvailable: true,
            shippingCharge: 49,
            freeShippingThreshold: 599
        })
    }
}

// POST: Get shipping rates from multiple providers
export async function POST(request: NextRequest) {
    try {
        const {
            pickupPincode,
            deliveryPincode,
            weight,
            dimensions,
            paymentMode
        } = await request.json()

        if (!deliveryPincode) {
            return NextResponse.json({ error: "Delivery pincode required" }, { status: 400 })
        }

        // In a full implementation, you'd get rates from all providers
        // For MVP, return estimated rates
        const providers: Array<{
            provider: ShippingProvider
            name: string
            rate: number
            estimatedDays: number
            available: boolean
        }> = [
                {
                    provider: "shiprocket",
                    name: "Shiprocket",
                    rate: weight > 0.5 ? 80 : 49,
                    estimatedDays: 4,
                    available: true
                },
                {
                    provider: "delhivery",
                    name: "Delhivery",
                    rate: weight > 0.5 ? 85 : 55,
                    estimatedDays: 5,
                    available: true
                },
                {
                    provider: "bluedart",
                    name: "Bluedart Express",
                    rate: weight > 0.5 ? 120 : 90,
                    estimatedDays: 3,
                    available: true
                },
                {
                    provider: "ecomexpress",
                    name: "Ecom Express",
                    rate: weight > 0.5 ? 75 : 45,
                    estimatedDays: 6,
                    available: true
                }
            ]

        // Filter by COD availability if needed
        const filteredProviders = paymentMode === "cod"
            ? providers.filter(p => p.provider !== "bluedart") // Example: Bluedart COD has restrictions
            : providers

        return NextResponse.json({
            rates: filteredProviders.sort((a, b) => a.rate - b.rate),
            recommended: filteredProviders[0]
        })
    } catch (error: any) {
        console.error("Rate calculation error:", error)
        return NextResponse.json({
            error: error.message || "Failed to get shipping rates"
        }, { status: 500 })
    }
}
