"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { setOAuthTokensAction } from "@/lib/auth-actions";

export default function AuthCallbackPage() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const hash = window.location.hash.replace(/^#/, "");
    // Clear hash immediately so a re-render can't re-read tokens
    window.history.replaceState({}, "", window.location.pathname);

    const params = new URLSearchParams(hash);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const expiresIn = Number(params.get("expiresIn") ?? "3600");

    if (!accessToken || !refreshToken) {
      router.replace("/auth/login?error=oauth_no_tokens");
      return;
    }

    (async () => {
      try {
        // 1. Store backend JWTs in HttpOnly cookies
        await setOAuthTokensAction({ accessToken, refreshToken, expiresIn });

        // 2. Create NextAuth session (uses the accessToken to fetch `me` profile)
        const result = await signIn("credentials", {
          accessToken,
          redirect: false,
        });

        if (result?.error) {
          router.replace("/auth/login?error=oauth_session_failed");
          return;
        }

        router.replace("/account");
      } catch {
        router.replace("/auth/login?error=oauth_callback_failed");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-sm text-muted-foreground">
      Finishing sign-in…
    </div>
  );
}
