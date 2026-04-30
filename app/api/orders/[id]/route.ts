import { NextResponse } from "next/server";
import * as ordersApi from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";

/** [id] here is treated as the order number (BFXXXXXX). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const o = await ordersApi.getOrder(id);
    if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(o);
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
