import { NextResponse } from "next/server";
import * as ordersApi from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const first = Number(url.searchParams.get("first") ?? 20);
    const after = url.searchParams.get("after") ?? undefined;
    return NextResponse.json(await ordersApi.listOrders(first, after ?? undefined));
  } catch (e) {
    return err(e);
  }
}

function err(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
