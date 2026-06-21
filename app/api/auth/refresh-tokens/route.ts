import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL, COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/api/config";

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(COOKIE_REFRESH)?.value;
  if (!refreshToken) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: `mutation Refresh($t: String!) {
        refreshTokens(refreshToken: $t) { accessToken refreshToken expiresIn }
      }`,
      variables: { t: refreshToken },
    }),
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ ok: false }, { status: 401 });

  const json = (await res.json()) as {
    data?: { refreshTokens: { accessToken: string; refreshToken: string; expiresIn: number } };
  };
  const tokens = json.data?.refreshTokens;
  if (!tokens) return NextResponse.json({ ok: false }, { status: 401 });

  const isProd = process.env.NODE_ENV === "production";
  const base = { httpOnly: true, secure: isProd, sameSite: "lax" as const, path: "/" };

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_ACCESS, tokens.accessToken, { ...base, maxAge: tokens.expiresIn });
  response.cookies.set(COOKIE_REFRESH, tokens.refreshToken, { ...base, maxAge: 30 * 24 * 60 * 60 });
  return response;
}
