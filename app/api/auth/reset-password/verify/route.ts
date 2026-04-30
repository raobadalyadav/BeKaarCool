import { NextResponse } from "next/server";

/**
 * Backend doesn't expose a separate "verify reset token" endpoint —
 * the token is verified atomically when resetPassword is called.
 * We accept the token here and short-circuit to "valid" so the existing
 * frontend flow keeps working; the actual verification still happens
 * server-side at reset time.
 */
export async function POST(req: Request) {
  try {
    const { token } = (await req.json()) as { token: string };
    if (!token || token.length < 20) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }
    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
}
