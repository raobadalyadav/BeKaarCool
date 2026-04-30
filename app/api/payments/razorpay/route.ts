import { NextResponse } from "next/server";
import * as checkoutApi from "@/lib/api/checkout";
import { ApiError } from "@/lib/api/client";

/**
 * Body: { sessionId } — checkout session id from startCheckout.
 * Returns the Razorpay PaymentIntent the frontend feeds to its checkout widget.
 */
export async function POST(req: Request) {
  try {
    const { sessionId } = (await req.json()) as { sessionId: string };
    return NextResponse.json(await checkoutApi.initiatePayment(sessionId));
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
