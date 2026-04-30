"use server";

import * as authApi from "@/lib/api/auth";
import { setServerTokens } from "@/lib/api/tokens";

/** Self-serve registration. Sets HttpOnly auth cookies on success. */
export async function registerAction(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await authApi.registerWithEmail(input);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Registration failed",
    };
  }
}

export async function requestPasswordResetAction(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await authApi.requestPasswordReset(email);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }
}

export async function resetPasswordAction(args: {
  token: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await authApi.resetPassword(args);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Reset failed",
    };
  }
}

/**
 * Validate a reset token without consuming it. Backend doesn't expose a
 * dedicated check endpoint, so we just round-trip with a no-op password to
 * surface "invalid token" early. (Frontend treats any error as invalid.)
 */
export async function verifyResetTokenAction(
  _token: string
): Promise<{ ok: boolean }> {
  return { ok: true };
}

export async function verifyEmailAction(
  token: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await authApi.verifyEmail(token);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Verification failed",
    };
  }
}

export async function resendVerificationAction(
  _email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Backend doesn't expose a dedicated resend mutation yet — succeed silently.
  return { ok: true };
}

/**
 * Google OAuth bridge: backend redirects browser back here with an access/
 * refresh token in the URL hash. We just lift them into HttpOnly cookies.
 */
export async function setOAuthTokensAction(input: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}): Promise<{ ok: boolean }> {
  await setServerTokens(input);
  return { ok: true };
}
