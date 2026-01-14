import { type NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Cart } from "@/models/Cart"
import { Product } from "@/models/Product"
import { User } from "@/models/User"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { resolveUserId } from "@/lib/auth-utils"
import { sendOrderConfirmationEmail } from "@/lib/email"
import DelhiveryService from "@/lib/delhivery"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")

    const skip = (page - 1) * limit

    // Resolve user ID to ensure it's a valid MongoDB ObjectId
    const userId = await resolveUserId(session.user.id, session.user.email)
    const filter: any = { user: userId }

    if (status && status !== "all") {
      filter.status = status
    }

    const orders = await Order.find(filter)
      .populate("items.product", "name images price category description")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Order.countDocuments(filter)

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ message: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Resolve user ID to ensure it's a valid MongoDB ObjectId
    const userId = await resolveUserId(session.user.id, session.user.email)

    const {
      items: rawItems,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentId,
      total,
      subtotal,
      shipping,
      tax,
      discount,
      couponCode,
      affiliateCode,
      paymentStatus, // Allow passing payment status
    } = await request.json()

    // Validate required fields
    if (!rawItems || !shippingAddress || !paymentMethod || !total) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Filter out items with invalid Product IDs (legacy data cleanup)
    const items = rawItems.filter((item: any) => {
      const pid = item.product || item.productId
      // Keep items without product (custom?) or with VALID ObjectId
      // If item has product ID but it's invalid, skip it.
      if ((item.product || item.productId) && !mongoose.isValidObjectId(pid)) {
        return false;
      }
      return true;
    })

    if (items.length === 0) {
      return NextResponse.json({ message: "No valid items in order (Please clear your cart)" }, { status: 400 })
    }

    // Validate stock availability (only for items with product)
    for (const item of items) {
      if (item.product || item.productId) {
        const productId = item.product || item.productId

        // Skip invalid IDs (e.g. from dummy data in old carts)
        if (!mongoose.isValidObjectId(productId)) {
          continue;
        }

        const product = await Product.findById(productId)
        if (!product || product.stock < item.quantity) {
          return NextResponse.json({ message: `Insufficient stock for ${product?.name || "product"}` }, { status: 400 })
        }
      }
    }

    // Calculate affiliate commission if applicable
    let affiliateCommission = 0
    if (affiliateCode) {
      const affiliate = await User.findOne({ affiliateCode })
      if (affiliate) {
        affiliateCommission = total * 0.05 // 5% commission
        affiliate.affiliateEarnings += affiliateCommission
        await affiliate.save()
      }
    }

    // Create order
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Determine status
    const initialPaymentStatus = paymentStatus || (paymentMethod === "cod" ? "pending" : "pending")
    // If online payment is initialized, status is pending. If explicitly "completed" (e.g. from verify), use that.

    // Build order items with required fields
    const orderItems = await Promise.all(items.map(async (item: any) => {
      const productId = item.product || item.productId
      let productName = item.name || "Custom Product"
      let productImage = item.image || "/placeholder.svg"

      // Fetch product details for name and image if we have a product ID
      if (productId && mongoose.isValidObjectId(productId)) {
        const product = await Product.findById(productId).select("name images")
        if (product) {
          productName = product.name
          productImage = product.images?.[0] || "/placeholder.svg"
        }
      }

      return {
        product: productId || null,
        customProduct: item.customProduct ? {
          name: item.customProduct.name,
          type: item.customProduct.type,
          basePrice: item.customProduct.basePrice,
        } : null,
        name: productName,
        image: productImage,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
        customization: item.customization,
        status: "pending" as const
      }
    }))

    const order = new Order({
      orderNumber,
      user: userId,
      customer: userId,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      paymentId,
      total,
      subtotal,
      shipping: shipping || 0,
      tax: tax || 0,
      discount: discount || 0,
      couponCode,
      affiliateCode,
      affiliateCommission,
      status: (initialPaymentStatus === "completed" || paymentMethod === "cod") ? "confirmed" : "pending",
      paymentStatus: initialPaymentStatus,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await order.save()

    // Update product stock and sales
    for (const item of items) {
      if (item.product || item.productId) {
        const productId = item.product || item.productId
        await Product.findByIdAndUpdate(productId, {
          $inc: { stock: -item.quantity, sold: item.quantity },
        })
      }
    }

    // Clear cart
    await Cart.findOneAndUpdate({ user: userId }, { items: [], total: 0, discount: 0, couponCode: null })

    // Get user details for email
    const user = await User.findById(userId)

    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail(user.email, user.name, order)
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError)
    }

    // Create shipment only if payment is confirmed or COD and we want immediate shipment
    // For pending online payments, shipment should be created in callback/webhook
    if (initialPaymentStatus === "completed" || paymentMethod === "cod") {
      try {
        const shipmentResult = await DelhiveryService.createShipment({
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          customer: {
            name: shippingAddress.name,
            phone: shippingAddress.phone,
            address: `${shippingAddress.address}, ${shippingAddress.landmark || ""}`,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.pincode,
            country: "India"
          },
          items: order.items.map((item: any) => ({
            name: item.name || "Product",
            sku: item.product?.toString() || `SKU-${item._id}`,
            quantity: item.quantity,
            price: item.price
          })),
          totalWeight: 0.5, // Default weight
          paymentMode: paymentMethod === "cod" ? "cod" : "prepaid",
          codAmount: paymentMethod === "cod" ? order.total : 0,
          invoiceValue: order.total
        })
        if (shipmentResult.success && shipmentResult.awbNumber) {
          order.trackingNumber = shipmentResult.awbNumber
          order.carrier = "delhivery"
          await order.save()
        }
      } catch (shipmentError) {
        console.error("Delhivery shipment creation error:", shipmentError)
      }
    }

    // Populate order for response
    await order.populate("items.product", "name images price category description")

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ message: "Failed to create order" }, { status: 500 })
  }
}
