import { NextResponse } from "next/server";
import * as productsApi from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";

export async function GET() {
  try {
    const [categories, brands, collections] = await Promise.all([
      productsApi.listCategories(),
      productsApi.listBrands(),
      productsApi.listCollections(),
    ]);
    return NextResponse.json({ categories, brands, collections });
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
