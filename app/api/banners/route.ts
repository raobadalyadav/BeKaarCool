import { NextResponse } from "next/server";
import * as contentApi from "@/lib/api/content";
import { ApiError } from "@/lib/api/client";

export async function GET() {
  try {
    return NextResponse.json(await contentApi.banners());
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json([], { status: 200 });
  }
}
