import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email: string };
    await requestPasswordReset(email);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
