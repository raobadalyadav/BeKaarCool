import { NextResponse } from "next/server";
import { setServerTokens } from "@/lib/api/tokens";

/**
 * POST /api/auth/callback
 * Body: { accessToken, refreshToken, expiresIn }
 *
 * Called by the /auth/callback page after parsing tokens from the URL hash.
 * Sets the HttpOnly cookies that backend GraphQL calls rely on.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      accessToken: string;
      refreshToken: string;
      expiresIn?: number;
    };
    if (!body.accessToken || !body.refreshToken) {
      return NextResponse.json({ error: "missing tokens" }, { status: 400 });
    }
    await setServerTokens({
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      expiresIn: body.expiresIn ?? 900,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "callback failed" }, { status: 500 });
  }
}
