import { NextResponse } from "next/server";

/**
 * The backend currently fires the verification email as part of the
 * registerWithEmail mutation; there's no public "resend" mutation yet.
 * Returning success keeps the existing UX from breaking — wire this to
 * a real resendEmailVerification mutation when it lands in the backend.
 */
export async function POST() {
  return NextResponse.json({ success: true });
}
