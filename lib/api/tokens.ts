/**
 * JWT cookie management — server + client.
 *  - Server: read/write via `next/headers` cookies()
 *  - Client: read via document.cookie (write happens via /api/session bridge)
 */

import { COOKIE_ACCESS, COOKIE_REFRESH, COOKIE_ANON_CART } from "./config";

const isServer = typeof window === "undefined";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ──────────────────────────── Server-side ────────────────────────────

export async function getServerAccessToken(): Promise<string | null> {
  if (!isServer) return null;
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return store.get(COOKIE_ACCESS)?.value ?? null;
}

export async function getServerRefreshToken(): Promise<string | null> {
  if (!isServer) return null;
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return store.get(COOKIE_REFRESH)?.value ?? null;
}

export async function setServerTokens(t: AuthTokens): Promise<void> {
  if (!isServer) return;
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  store.set(COOKIE_ACCESS, t.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: t.expiresIn,
  });
  store.set(COOKIE_REFRESH, t.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function clearServerTokens(): Promise<void> {
  if (!isServer) return;
  const { cookies } = await import("next/headers");
  const store = await cookies();
  store.delete(COOKIE_ACCESS);
  store.delete(COOKIE_REFRESH);
}

// ──────────────────────────── Client-side ────────────────────────────

const readCookie = (name: string): string | null => {
  if (isServer) return null;
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&")}=([^;]*)`)
  );
  return m ? decodeURIComponent(m[1]!) : null;
};

export const getClientAnonId = (): string | null =>
  readCookie(COOKIE_ANON_CART);
