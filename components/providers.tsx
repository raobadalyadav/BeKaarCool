"use client";

import type React from "react";
import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/contexts/language-context";
import { CurrencyProvider } from "@/contexts/currency-context";
import { ChatProvider } from "@/contexts/chat-context";
import { CartProvider } from "@/contexts/cart-context";
import { LiveChat } from "@/components/support/live-chat";
import { ReferralCapture } from "@/components/referral-capture";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <CartProvider>
            <ChatProvider>
              <ReferralCapture />
              <div className="min-h-screen flex flex-col">
                <main className="flex-1">{children}</main>
                <LiveChat />
              </div>
            </ChatProvider>
          </CartProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
