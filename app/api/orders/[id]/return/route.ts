import { NextResponse } from "next/server";
import * as ordersApi from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      items: Array<{ orderItemId: string; quantity: number; reason?: string }>;
      reason?: string;
    };
    return NextResponse.json({
      returnId: await ordersApi.requestReturn({
        orderNumber: id,
        items: body.items,
        reason: body.reason,
      }),
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
