import { Metadata } from "next"
import { generateMetadata as generateSEOMetadata } from "@/lib/seo"
import CategoriesPageClient from "./categories-client"

export const metadata: Metadata = generateSEOMetadata({
  title: "Categories - Browse All Product Categories",
  description: "Explore all product categories including Fashion, Electronics, Accessories and more. Find exactly what you're looking for.",
  keywords: ["categories", "fashion", "electronics", "accessories", "product categories", "browse"]
})

export default function CategoriesPage() {
  return <CategoriesPageClient />
}