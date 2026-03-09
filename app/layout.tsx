import type React from "react";
import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { env } from "@/lib/env";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import Script from "next/script";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";

// Primary font for headings - Modern, geometric, fashion-forward
const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit"
});

// Secondary font for body text - Clean, professional, highly readable
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta"
});

export const metadata: Metadata = generateSEOMetadata({
  title: "Baefikra ",
  description: " fast delivery across India.",
  keywords: ["custom printing", "print on demand", "t-shirt design", "custom merchandise", "personalized gifts", "online marketplace"]
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${plusJakarta.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#1E40AF" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={plusJakarta.className}>
        <Providers>
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
                "description": "Premium custom print-on-demand marketplace in India",
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
        </Providers>
      </body>
    </html>
  );
}
