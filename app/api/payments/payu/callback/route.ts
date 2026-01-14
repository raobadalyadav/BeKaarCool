import { type NextRequest, NextResponse } from "next/server"
import { Order } from "@/models/Order"
import { connectDB } from "@/lib/mongodb"
import { createShipment } from "@/lib/shipping"
import { sendOrderConfirmationEmail } from "@/lib/email"
import { User } from "@/models/User"
import { verifyPayUPayment } from "@/lib/payments"

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const params: Record<string, string> = {}
        formData.forEach((value, key) => {
            params[key] = value as string
        })

        if (params.status === "success") {
            const isValid = verifyPayUPayment(params)

            if (isValid) {
                await connectDB()
                const orderId = params.txnid

                const order = await Order.findOne({ orderNumber: orderId })
                if (order) {
                    if (order.status !== "confirmed") {
                        order.status = "confirmed"
                        order.paymentStatus = "completed"
                        order.paymentId = params.mihpayid
                        await order.save()

                        const user = await User.findById(order.user)
                        if (user) {
                            sendOrderConfirmationEmail(user.email, user.name, order).catch(console.error)
                        }

                        try {
                            const shipmentData = await createShipment(order, order.shippingAddress)
                            if (shipmentData?.awbNumber) {
                                order.trackingNumber = shipmentData.awbNumber
                                await order.save()
                            }
                        } catch (e) {
                            console.error("Shipping creation failed:", e)
                        }
                    }
                    return NextResponse.redirect(new URL(`/order-confirmation?orderNumber=${orderId}`, request.url))
                }
            }
        }

        return NextResponse.redirect(new URL("/checkout?error=PaymentFailed", request.url))

    } catch (error) {
        console.error("PayU callback error:", error)
        return NextResponse.redirect(new URL("/checkout?error=CallbackError", request.url))
    }
}
