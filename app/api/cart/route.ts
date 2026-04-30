import { NextResponse } from "next/server";
import * as cartApi from "@/lib/api/cart";
import { ApiError } from "@/lib/api/client";

export async function GET() {
  try {
    return NextResponse.json(await cartApi.getCart());
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { variantId: string; quantity: number };
    return NextResponse.json(
      await cartApi.addToCart(body.variantId, body.quantity)
    );
  } catch (e) {
    return errorResponse(e);
  }
}

function errorResponse(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
