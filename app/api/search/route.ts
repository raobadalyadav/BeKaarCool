import { NextResponse } from "next/server";
import * as productsApi from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? "";
    const first = Number(url.searchParams.get("first") ?? 24);
    return NextResponse.json(await productsApi.search({ q, first }));
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
