"use client";

import type React from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/contexts/language-context";
import { CurrencyProvider } from "@/contexts/currency-context";
import { ChatProvider } from "@/contexts/chat-context";
import { CartProvider } from "@/contexts/cart-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { ReferralCapture } from "@/components/referral-capture";

export function Providers({ children, session }: { children: React.ReactNode; session: Session | null }) {
  return (
    <SessionProvider session={session}>
      <LanguageProvider>
        <CurrencyProvider>
          <CartProvider>
            <WishlistProvider>
            <ChatProvider>
              <ReferralCapture />
              <div className="min-h-screen flex flex-col">
                <main className="flex-1">{children}</main>
              </div>
            </ChatProvider>
            </WishlistProvider>
          </CartProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
