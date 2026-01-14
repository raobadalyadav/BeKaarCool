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
    // Handle dummy products for UI development/redesign
    if (id.startsWith('dummy-')) {
      const index = parseInt(id.split('-')[1]) || 0;
      return {
        _id: id,
        name: `Bewakoof Style T-Shirt ${index + 1} - ${index % 2 === 0 ? 'Black' : 'White'}`,
        description: "Experienced comfort like never before with our premium cotton t-shirt. Designed for the modern trendsetter, this piece combines style and ease. breathable fabric ensures you stay cool all day long. Perfect for casual outings or lounging at home.",
        price: 499 + (index * 50),
        originalPrice: 999 + (index * 100),
        images: [
          `https://images.unsplash.com/photo-${index % 2 === 0 ? '1523381210434-271e8be1f52b' : '1583743814966-8936f5b7be1a'}?auto=format&fit=crop&q=80&w=600`,
          `https://images.unsplash.com/photo-${index % 2 === 0 ? '1583743814966-8936f5b7be1a' : '1523381210434-271e8be1f52b'}?auto=format&fit=crop&q=80&w=600`,
          "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=600",
          "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=600"
        ],
        category: index % 2 === 0 ? "Men" : "Women",
        rating: 4.2,
        reviews: [],
        stock: 20,
        sold: 50 + index * 10,
        brand: "BeKaarCool",
        isActive: true,
        variations: {
          sizes: ["S", "M", "L", "XL", "2XL"],
          colors: ["Black", "White", "Navy", "Gray"]
        },
        tags: ["casual", "cotton", "trend"],
        seller: { name: "BeKaarCool Official" }
      }
    }

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

// No change needed to generateMetadata as it calls getProduct
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
    keywords: [product.category, product.brand, ...(product.tags || [])].filter(Boolean),
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