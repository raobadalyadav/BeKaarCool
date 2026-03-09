import { Metadata } from "next"
import { generateMetadata as generateSEOMetadata } from "@/lib/seo"
import ProductsPageClient from "./products-client"

export const metadata: Metadata = generateSEOMetadata({
  title: "Shop All Collections",
  description: "Browse the latest in urban fashion and streetwear. From oversized t-shirts to trendy accessories, find your perfect vibe at Baefikra.",
  keywords: ["streetwear", "oversized t-shirts", "graphic hoodies", "urban fashion", "casual wear", "lifestyle accessories"]
})

export default function ProductsPage() {
  return <ProductsPageClient />
}