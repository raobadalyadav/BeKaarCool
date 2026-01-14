import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import Script from "next/script";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = generateSEOMetadata({
  title: "Custom Print-on-Demand & Design Marketplace",
  description: "Create and sell custom designs on t-shirts, hoodies, mugs, and more. Premium quality printing with fast delivery across India.",
  keywords: ["custom printing", "print on demand", "t-shirt design", "custom merchandise", "personalized gifts", "online marketplace"]
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#1E40AF" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
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
                "name": "BeKaarCool",
                "url": process.env.NEXTAUTH_URL || "https://bekaarcool.com",
                "logo": `${process.env.NEXTAUTH_URL || "https://bekaarcool.com"}/logo.png`,
                "description": "Premium custom print-on-demand marketplace in India",
                "sameAs": [
                  "https://instagram.com/bekaarcool",
                  "https://twitter.com/bekaarcool"
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
                "name": "BeKaarCool",
                "url": process.env.NEXTAUTH_URL || "https://bekaarcool.com",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${process.env.NEXTAUTH_URL || "https://bekaarcool.com"}/products?search={search_term_string}`
                  },
                  "query-input": "required name=search_term_string"
                }
              })
            }}
          />
          <Toaster />
          <SonnerToaster />
        </Providers>
      </body>
    </html>
  );
}
