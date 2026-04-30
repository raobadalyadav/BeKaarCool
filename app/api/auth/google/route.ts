import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api/config";

/** Bounce the user to the backend's Google OAuth start. The backend's
 *  callback completes OAuth and 302's to WEB_URL with tokens in the URL hash;
 *  the frontend's /auth/callback page reads them. */
export async function GET() {
  return NextResponse.redirect(`${API_URL}/auth/google`);
}
