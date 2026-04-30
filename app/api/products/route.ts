import { NextResponse } from "next/server";
import * as productsApi from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const first = Number(url.searchParams.get("first") ?? url.searchParams.get("limit") ?? 24);
    const after = url.searchParams.get("after") ?? undefined;
    const categoryId = url.searchParams.get("categoryId") ?? undefined;
    const brandId = url.searchParams.get("brandId") ?? undefined;
    const conn = await productsApi.listProducts({ first, after, categoryId, brandId });
    return NextResponse.json(conn);
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
