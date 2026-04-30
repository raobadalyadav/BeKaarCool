import { NextResponse } from "next/server";
import * as checkoutApi from "@/lib/api/checkout";
import { ApiError } from "@/lib/api/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pincode = url.searchParams.get("pincode");
    if (!pincode) {
      return NextResponse.json({ error: "pincode required" }, { status: 400 });
    }
    return NextResponse.json(await checkoutApi.checkPincode(pincode));
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
