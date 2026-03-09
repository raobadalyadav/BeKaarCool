import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Razorpay from "razorpay";
import { env } from "@/lib/env";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { resolveUserId } from "@/lib/auth-utils";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id || id === "null" || id === "undefined") {
      return NextResponse.json(
        { message: "Invalid order ID" },
        { status: 400 },
      );
    }

    await connectDB();
    const userId = await resolveUserId(session.user.id, session.user.email);

    // Find the order and verify it can be paid
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership
    const orderUserId = order.user?._id?.toString() || order.user?.toString();
    if (orderUserId !== userId && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify order status
    if (
      order.paymentStatus !== "pending" &&
      order.paymentStatus !== "failed"
    ) {
      return NextResponse.json(
        { error: `Order is already ${order.paymentStatus}` },
        { status: 400 },
      );
    }

    if (
      order.status === "cancelled" ||
      order.status === "refunded" ||
      order.status === "delivered"
    ) {
      return NextResponse.json(
        { error: `Cannot pay for ${order.status} order` },
        { status: 400 },
      );
    }

    const amount = Math.round(order.total * 100); // Amount should be in paise
    // Razorpay receipt max length is 40 chars. ID is ~24 chars. 
    const shortId = id.toString().substring(0, 10);
    const receipt = `rcpt_${shortId}_${Date.now().toString().slice(-6)}`;

    const options: any = {
      amount,
      currency: "INR",
      receipt,
      payment_capture: true,
      notes: {
        email: session.user.email || "",
        userId: session.user.id,
        orderId: id, // Link back to our DB order ID
        type: "cod_to_prepaid",
      },
    };

    const razorpayOrder: any = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Razorpay COD-to-Prepaid initiation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to initiate payment",
      },
      { status: 500 },
    );
  }
}
