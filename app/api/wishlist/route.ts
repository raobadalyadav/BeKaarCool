import { NextResponse } from "next/server";
import * as wishlistApi from "@/lib/api/wishlist";
import { ApiError } from "@/lib/api/client";

export async function GET() {
  try {
    return NextResponse.json(await wishlistApi.myWishlist());
  } catch (e) {
    return err(e);
  }
}

export async function POST(req: Request) {
  try {
    const { productId } = (await req.json()) as { productId: string };
    return NextResponse.json(await wishlistApi.addToWishlist(productId));
  } catch (e) {
    return err(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const { productId } = (await req.json()) as { productId: string };
    return NextResponse.json({
      removed: await wishlistApi.removeFromWishlist(productId),
    });
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
