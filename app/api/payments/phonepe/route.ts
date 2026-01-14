import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createPhonePeOrder } from "@/lib/payments"

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

        const result = await createPhonePeOrder({
            amount: Math.round(amount), // Amount in paise
            orderId: orderId || `PHN-${Date.now()}`,
            customerName: session.user.name || "Customer",
            customerEmail: customerEmail || session.user.email || "",
            customerPhone: customerPhone || "",
            description: "BeKaarCool Order"
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("PhonePe order creation error:", error)
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to create PhonePe order"
        }, { status: 500 })
    }
}
