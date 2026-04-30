"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Backend /auth/google/callback redirects here with tokens in the URL hash:
 *   /auth/callback#accessToken=...&refreshToken=...
 * We parse the hash, POST tokens to /api/auth/callback (sets HttpOnly cookies),
 * then route to /account.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const accessToken = params.get("accessToken");
      const refreshToken = params.get("refreshToken");
      if (!accessToken || !refreshToken) {
        router.replace("/auth/login?error=oauth_no_tokens");
        return;
      }
      const res = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken, refreshToken }),
      });
      if (!res.ok) {
        router.replace("/auth/login?error=oauth_callback_failed");
        return;
      }
      // Strip the hash and route into the app.
      window.history.replaceState({}, "", "/account");
      router.replace("/account");
      router.refresh();
    };
    run();
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-sm text-muted-foreground">
      Finishing sign-in…
    </div>
  );
}
