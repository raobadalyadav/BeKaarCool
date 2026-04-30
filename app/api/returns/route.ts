import { NextResponse } from "next/server";
import * as ordersApi from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Parameters<
      typeof ordersApi.requestReturn
    >[0];
    return NextResponse.json({ returnId: await ordersApi.requestReturn(body) });
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
