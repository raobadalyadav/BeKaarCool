import { NextResponse } from "next/server";
import * as productsApi from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? "";
    const first = Number(url.searchParams.get("first") ?? 24);
    const sort = (url.searchParams.get("sort") ?? undefined) as
      | "price_asc" | "price_desc" | "rating_desc" | "popularity" | undefined;
    const r = await productsApi.search({ q, first, sort });
    return NextResponse.json(r);
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
