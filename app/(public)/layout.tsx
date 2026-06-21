import type React from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FlashSaleBanner } from "@/components/marketing/flash-sale-banner";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main >
      <FlashSaleBanner />
      <Header />
      {children}
      <Footer />
    </main>
  );
}
