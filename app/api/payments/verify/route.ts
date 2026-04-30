import { NextResponse } from "next/server";

/**
 * Razorpay payment verification is now performed server-to-server by the
 * backend's HMAC-checked /webhooks/razorpay. The frontend only needs to know
 * the order succeeded — it can poll the backend's order(number) query for the
 * `paid` state. This route is kept for backwards compatibility and just
 * returns success so existing client code doesn't break.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { orderNumber?: string };
    return NextResponse.json({
      success: true,
      orderNumber: body.orderNumber ?? null,
    });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
