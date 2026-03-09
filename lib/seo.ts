import { Metadata } from "next"
import { env } from "@/lib/env"

export interface SEOConfig {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: "website" | "article" | "product"
  noIndex?: boolean
}

const defaultSEO = {
  title: "Baefikra - Custom Print-on-Demand & Design Marketplace",
  description: "Create and sell custom designs on t-shirts, hoodies, mugs, and more. Premium quality printing with fast delivery across India.",
  keywords: ["custom printing", "print on demand", "t-shirt design", "custom merchandise", "personalized gifts"],
  image: "/og-image.jpg",
  url: env.NEXTAUTH_URL || "https://baefikra.com"
}

export function generateMetadata(config: SEOConfig = {}): Metadata {
  const title = config.title ? `${config.title} | Baefikra` : defaultSEO.title
  const description = config.description || defaultSEO.description
  const keywords = [...(config.keywords || []), ...defaultSEO.keywords]
  const image = config.image || defaultSEO.image
  const url = config.url || defaultSEO.url

  return {
    metadataBase: new URL(env.NEXTAUTH_URL || 'http://localhost:3000'),
    title,
    description,
    keywords: keywords.join(", "),
    authors: [{ name: "Baefikra" }],
    creator: "Baefikra",
    publisher: "Baefikra",
    robots: config.noIndex ? "noindex,nofollow" : "index,follow",
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@baefikra"
    },
    alternates: {
      canonical: url
    }
  }
}

export function generateProductSchema(product: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    brand: { "@type": "Brand", name: product.brand || "Baefikra" },
    category: product.category,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    },
    aggregateRating: product.rating > 0 ? {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviews?.length || 0
    } : undefined
  }
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}