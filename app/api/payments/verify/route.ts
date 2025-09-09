import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Cart } from "@/models/Cart"
import { Product } from "@/models/Product"
import { User } from "@/models/User"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { resolveUserId } from "@/lib/auth-utils"
import { sendOrderConfirmationEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = await request.json()

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex")

    const isAuthentic = expectedSignature === razorpay_signature

    if (!isAuthentic) {
      return NextResponse.json({ verified: false }, { status: 400 })
    }

    // Get session for order creation
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Resolve user ID
    const userId = await resolveUserId(session.user.id, session.user.email)
    const user = await User.findById(userId)

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create order
    const order = new Order({
      orderNumber,
      user: userId,
      customer: userId,
      items: orderData.items.map((item: any) => ({
        product: item.productId || null,
        customProduct: item.customProduct ? {
          name: item.customProduct.name,
          type: item.customProduct.type,
          basePrice: item.customProduct.basePrice,
        } : null,
        quantity: item.quantity,
        price: item.price,
        size: item.size || 'M',
        color: item.color || 'Default',
        customization: item.customization,
      })),
      total: orderData.total || orderData.totalAmount,
      subtotal: Math.round((orderData.total || orderData.totalAmount) * 0.85),
      shipping: (orderData.total || orderData.totalAmount) > 500 ? 0 : 50,
      tax: Math.round((orderData.total || orderData.totalAmount) * 0.18),
      discount: orderData.discount || 0,
      couponCode: orderData.couponCode,
      status: "confirmed",
      paymentStatus: "paid",
      paymentMethod: "razorpay",
      paymentId: razorpay_payment_id,
      shippingAddress: {
        name: orderData.shippingAddress.name,
        phone: orderData.shippingAddress.phone,
        address: orderData.shippingAddress.address,
        city: orderData.shippingAddress.city,
        state: orderData.shippingAddress.state,
        pincode: orderData.shippingAddress.pincode,
        country: "India",
      },
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })

    await order.save()

    // Process these operations in parallel to reduce time
    const [, ,] = await Promise.all([
      // Update product stock (only for items with productId)
      Promise.all(
        orderData.items
          .filter((item: any) => item.productId)
          .map((item: any) => 
            Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: -item.quantity, sold: item.quantity },
            })
          )
      ),
      // Clear cart
      Cart.findOneAndUpdate(
        { user: userId },
        { items: [], total: 0, discount: 0, couponCode: null }
      ),
      // Send confirmation email (don't wait for it)
      sendOrderConfirmationEmail(user.email, user.name, order).catch(err => 
        console.error("Email error:", err)
      )
    ])

    return NextResponse.json({ 
      verified: true, 
      paymentId: razorpay_payment_id,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total
      }
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 })
  }
}
