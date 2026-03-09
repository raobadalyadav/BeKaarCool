import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { resolveUserId } from "@/lib/auth-utils";
import { sendPaymentSuccessEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ verified: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id || id === "null" || id === "undefined") {
      return NextResponse.json(
        { verified: false, message: "Invalid order ID" },
        { status: 400 },
      );
    }

    const { razorpayOrderId, paymentId, signature } = await request.json();

    if (!razorpayOrderId || !paymentId || !signature) {
      return NextResponse.json(
        { verified: false, message: "Missing required payment fields" },
        { status: 400 },
      );
    }

    // Verify payment signature
    const body = razorpayOrderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === signature;

    if (!isAuthentic) {
      return NextResponse.json(
        { verified: false, message: "Invalid payment signature" },
        { status: 400 },
      );
    }

    // Connect to DB and update the specific order
    await connectDB();
    const userId = await resolveUserId(session.user.id, session.user.email);

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ verified: false, message: "Order not found" }, { status: 404 });
    }

    // Verify ownership
    const orderUserId = order.user?._id?.toString() || order.user?.toString();
    if (orderUserId !== userId && session.user.role !== "admin") {
      return NextResponse.json({ verified: false, message: "Unauthorized" }, { status: 403 });
    }

    // Ensure we don't double process
    if (order.paymentStatus === "paid") {
      return NextResponse.json({ verified: true, message: "Order already paid" });
    }

    // Update order status
    order.paymentStatus = "paid";
    order.paymentMethod = "razorpay";
    order.paymentId = paymentId;

    await order.save();
    
    // Dispatch Payment Success Email
    sendPaymentSuccessEmail(session.user.email!, session.user.name!, order).catch(console.error);

    return NextResponse.json({
      verified: true,
      paymentId,
      message: "Payment successfully captured and order updated",
    });
  } catch (error: any) {
    console.error("Razorpay COD-to-Prepaid verification error:", error);
    return NextResponse.json(
      { verified: false, error: error.message || "Payment verification failed" },
      { status: 500 },
    );
  }
}
