import { NextResponse } from "next/server";
import * as cartApi from "@/lib/api/cart";
import { ApiError } from "@/lib/api/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = (await req.json()) as { quantity: number };
    return NextResponse.json(
      await cartApi.updateCartItem(itemId, body.quantity)
    );
  } catch (e) {
    return err(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    return NextResponse.json(await cartApi.removeFromCart(itemId));
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
