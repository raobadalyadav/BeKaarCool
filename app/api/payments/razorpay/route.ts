import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Razorpay from "razorpay"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, currency = "INR" } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const options: any = {
      amount: Math.round(amount), // Amount should already be in paise from frontend
      currency,
      receipt,
      payment_capture: true,
      notes: {
        email: session.user.email || "",
        userId: session.user.id
      }
    }

    const order: any = await razorpay.orders.create(options)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    })
  } catch (error: any) {
    console.error("Razorpay order creation error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to create payment order"
    }, { status: 500 })
  }
}
