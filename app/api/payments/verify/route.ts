import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveUserId } from "@/lib/auth-utils";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentId, signature } = await request.json();

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { verified: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify payment signature
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === signature;

    if (!isAuthentic) {
      return NextResponse.json(
        { verified: false, message: "Invalid signature" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      verified: true,
      paymentId,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 },
    );
  }
}
