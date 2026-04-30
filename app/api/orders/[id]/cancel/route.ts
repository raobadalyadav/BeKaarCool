import { NextResponse } from "next/server";
import * as ordersApi from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as {
      reason?: string;
      itemIds?: string[];
    };
    const o = await ordersApi.cancelOrder({
      number: id,
      reason: body.reason ?? "customer_cancel",
      itemIds: body.itemIds,
    });
    return NextResponse.json(o);
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
