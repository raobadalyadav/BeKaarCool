import { Metadata } from "next"

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
  title: "BeKaarCool - Custom Print-on-Demand & Design Marketplace",
  description: "Create and sell custom designs on t-shirts, hoodies, mugs, and more. Premium quality printing with fast delivery across India.",
  keywords: ["custom printing", "print on demand", "t-shirt design", "custom merchandise", "personalized gifts"],
  image: "/og-image.jpg",
  url: process.env.NEXTAUTH_URL || "https://bekaarcool.com"
}

export function generateMetadata(config: SEOConfig = {}): Metadata {
  const title = config.title ? `${config.title} | BeKaarCool` : defaultSEO.title
  const description = config.description || defaultSEO.description
  const keywords = [...(config.keywords || []), ...defaultSEO.keywords]
  const image = config.image || defaultSEO.image
  const url = config.url || defaultSEO.url

  return {
    metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
    title,
    description,
    keywords: keywords.join(", "),
    authors: [{ name: "BeKaarCool" }],
    creator: "BeKaarCool",
    publisher: "BeKaarCool",
    robots: config.noIndex ? "noindex,nofollow" : "index,follow",
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@bekaarcool"
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
    brand: { "@type": "Brand", name: product.brand || "BeKaarCool" },
    category: product.category,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: product.seller?.name || "BeKaarCool" }
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