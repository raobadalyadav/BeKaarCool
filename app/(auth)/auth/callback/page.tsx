"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setOAuthTokensAction } from "@/lib/auth-actions";

/**
 * Backend /auth/google/callback redirects here with tokens in the URL hash:
 *   /auth/callback#accessToken=...&refreshToken=...&expiresIn=...
 * We parse the hash, lift tokens into HttpOnly cookies via a server action,
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
      const expiresIn = Number(params.get("expiresIn") ?? "3600");
      if (!accessToken || !refreshToken) {
        router.replace("/auth/login?error=oauth_no_tokens");
        return;
      }
      try {
        await setOAuthTokensAction({ accessToken, refreshToken, expiresIn });
      } catch {
        router.replace("/auth/login?error=oauth_callback_failed");
        return;
      }
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
