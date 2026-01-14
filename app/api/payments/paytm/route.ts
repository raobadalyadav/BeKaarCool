import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createPaytmOrder } from "@/lib/payments"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { amount, orderId, customerPhone, customerEmail } = await request.json()

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
        }

        const result = await createPaytmOrder({
            amount: Math.round(amount), // in paise, but paytm helper converts to rupees
            orderId: orderId || `PAYTM-${Date.now()}`,
            customerName: session.user.name || "Customer",
            customerEmail: customerEmail || session.user.email || "",
            customerPhone: customerPhone || "9999999999",
            description: "BeKaarCool Order"
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("Paytm order creation error:", error)
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to create Paytm order"
        }, { status: 500 })
    }
}
