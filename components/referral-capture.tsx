"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import * as referralsApi from "@/lib/api/referrals";

const STORAGE_KEY = "bf_pending_referral";

/**
 * Captures `?ref=CODE` from the URL and stashes it in sessionStorage. As soon
 * as the user is authenticated (now or on a future page-load), we POST it to
 * `applyReferralCode` once and clear the stash. Backend is idempotent on
 * (refereeId, signed_up) so a duplicate is harmless.
 */
export function ReferralCapture() {
  const { status } = useSession();

  // 1. Capture the URL param on every mount where it's present.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (ref) {
      try {
        sessionStorage.setItem(STORAGE_KEY, ref.toUpperCase());
      } catch {
        // private mode etc — ignore
      }
    }
  }, []);

  // 2. Once authenticated, apply any pending code and clear it.
  useEffect(() => {
    if (status !== "authenticated") return;
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (!pending) return;
    (async () => {
      try {
        await referralsApi.applyReferralCode(pending);
      } catch {
        // first-time only — silently swallow if the code was already used
        // (e.g. user previously signed up with a different code)
      } finally {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }
    })();
  }, [status]);

  return null;
}
