import { NextResponse } from "next/server";

/**
 * Backend doesn't expose testimonials yet; reviews live per-product.
 * Returning an empty array keeps the homepage carousel from breaking.
 */
export async function GET() {
  return NextResponse.json([]);
}
