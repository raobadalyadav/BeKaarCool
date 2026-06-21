import type React from "react";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { env } from "@/lib/env";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import Script from "next/script";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Chatbot } from "@/components/ai/chatbot";

// Body font — Inter: modern, clean, highly readable
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

// Heading font — Playfair Display: elegant, luxury, serif
const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = generateSEOMetadata({
  title: "Baefikra",
  description: "Express your vibe with Baefikra. Premium oversized t-shirts, hoodies, and lifestyle accessories.",
  keywords: ["oversized t-shirts", "streetwear", "urban fashion", "unisex apparel", "graphic tees", "lifestyle brand", "india fashion"]
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#F38508" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <Providers session={session}>
          {children}
          <Script
            src="https://checkout.razorpay.com/v1/checkout.js"
            defer
          />
          <Script
            id="organization-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Baefikra",
                "url": env.NEXTAUTH_URL || "https://baefikra.com",
                "logo": `${env.NEXTAUTH_URL || "https://baefikra.com"}/logo.png`,
                "description": "Premium lifestyle and fashion brand specialized in unconventional streetwear and accessories.",
                "sameAs": [
                  "https://instagram.com/baefikra",
                  "https://twitter.com/baefikra"
                ],
                "contactPoint": {
                  "@type": "ContactPoint",
                  "telephone": "+91-XXXXXXXXXX",
                  "contactType": "customer service",
                  "availableLanguage": ["English", "Hindi"]
                }
              })
            }}
          />
          <Script
            id="website-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Baefikra",
                "url": env.NEXTAUTH_URL || "https://baefikra.com",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${env.NEXTAUTH_URL || "https://baefikra.com"}/products?search={search_term_string}`
                  },
                  "query-input": "required name=search_term_string"
                }
              })
            }}
          />
          <SonnerToaster />
          <Chatbot />
        </Providers>
      </body>
    </html>
  );
}
