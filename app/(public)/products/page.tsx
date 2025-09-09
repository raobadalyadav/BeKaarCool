import { Metadata } from "next"
import { generateMetadata as generateSEOMetadata } from "@/lib/seo"
import ProductsPageClient from "./products-client"

export const metadata: Metadata = generateSEOMetadata({
  title: "Products - Custom Print-on-Demand Marketplace",
  description: "Browse thousands of custom products including t-shirts, hoodies, mugs, phone cases and more. Filter by category, price, and brand.",
  keywords: ["custom products", "print on demand", "t-shirts", "hoodies", "mugs", "phone cases", "personalized gifts"]
})

export default function ProductsPage() {
  return <ProductsPageClient />
}