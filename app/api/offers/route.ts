import { NextResponse } from "next/server";
import * as productsApi from "@/lib/api/products";

/**
 * "Offers" in the legacy frontend were a curated product list. With the new
 * backend they map to coupon-driven discounts; until a dedicated `featuredOffers`
 * resolver lands we return published products with discount as a placeholder.
 */
export async function GET() {
  try {
    const conn = await productsApi.listProducts({ first: 12, status: "published" });
    return NextResponse.json(conn.edges.map((e) => e.node));
  } catch {
    return NextResponse.json([]);
  }
}
