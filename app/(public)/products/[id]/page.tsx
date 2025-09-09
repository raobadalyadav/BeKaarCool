import { Metadata } from "next"
import { notFound } from "next/navigation"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { Review } from "@/models/Review"
import { generateMetadata as generateSEOMetadata, generateProductSchema, generateBreadcrumbSchema } from "@/lib/seo"
import Script from "next/script"
import ProductDetailClient from "./product-detail-client"

interface Props {
  params: Promise<{ id: string }>
}

async function getProduct(id: string) {
  try {
    // Validate MongoDB ObjectId format
    if (!id || id === 'undefined' || id === 'null' || !/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Invalid product ID format:', id)
      return null
    }

    await connectDB()
    console.log('Searching for product with ID:', id)
    
    const product = await Product.findById(id)
      .populate("seller", "name email avatar")
      .populate("reviews")
      .lean()
    
    console.log('Product found:', !!product)
    
    if (!product || (product as any).isActive === false) {
      console.log('Product not found or inactive')
      return null
    }
    
    return JSON.parse(JSON.stringify(product))
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  
  if (!product) {
    return generateSEOMetadata({
      title: "Product Not Found",
      description: "The product you're looking for doesn't exist.",
      noIndex: true
    })
  }

  return generateSEOMetadata({
    title: product.name,
    description: product.description.substring(0, 160),
    keywords: [product.category, product.brand, ...product.tags].filter(Boolean),
    image: product.images[0],
    url: `${process.env.NEXTAUTH_URL}/products/${product._id}`,
    type: "product"
  })
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const product = await getProduct(id)
  
  if (!product) {
    notFound()
  }

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
    { name: product.category, url: `/products?category=${product.category}` },
    { name: product.name, url: `/products/${product._id}` }
  ]

  return (
    <>
      <ProductDetailClient product={product} />
      
      <Script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateProductSchema(product))
        }}
      />
      
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems))
        }}
      />
    </>
  )
}