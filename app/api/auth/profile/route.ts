import { NextResponse } from "next/server";
import { me } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export async function GET() {
  try {
    const u = await me();
    if (!u) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(u);
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
