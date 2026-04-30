import { NextResponse } from "next/server";
import { resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export async function POST(req: Request) {
  try {
    const { token, newPassword, password } = (await req.json()) as {
      token: string;
      newPassword?: string;
      password?: string;
    };
    const np = newPassword ?? password;
    if (!np) {
      return NextResponse.json(
        { error: "newPassword is required" },
        { status: 400 }
      );
    }
    await resetPassword({ token, newPassword: np });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
