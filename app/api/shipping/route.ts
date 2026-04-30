import { NextResponse } from "next/server";
import * as checkoutApi from "@/lib/api/checkout";
import { ApiError } from "@/lib/api/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const originPincode = url.searchParams.get("originPincode") ?? "400001";
    const destPincode = url.searchParams.get("destPincode");
    if (!destPincode) {
      return NextResponse.json({ error: "destPincode required" }, { status: 400 });
    }
    const weightGrams = Number(url.searchParams.get("weightGrams") ?? 1000);
    const cod = url.searchParams.get("cod") === "true";
    const declaredValueMinor = url.searchParams.get("declaredValueMinor") ?? undefined;
    return NextResponse.json(
      await checkoutApi.shippingRates({
        originPincode,
        destPincode,
        weightGrams,
        cod,
        declaredValueMinor: declaredValueMinor ?? undefined,
      })
    );
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
