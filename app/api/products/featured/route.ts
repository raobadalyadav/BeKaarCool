import { NextResponse } from "next/server";
import * as productsApi from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const first = Number(url.searchParams.get("limit") ?? 8);
    const conn = await productsApi.listProducts({ first, status: "published" });
    return NextResponse.json(conn.edges.map((e) => e.node));
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
