import { Metadata } from "next"
import { notFound } from "next/navigation"
import { generateMetadata as generateSEOMetadata, generateProductSchema, generateBreadcrumbSchema } from "@/lib/seo"
import Script from "next/script"
import ProductDetailClient from "./product-detail-client"

interface Props {
    params: Promise<{ slug: string }>
}

async function getProduct(slug: string) {
    try {
        if (!slug || slug === 'undefined' || slug === 'null') {
            return null
        }

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const response = await fetch(`${baseUrl}/api/products/slug/${slug}`, {
            cache: 'no-store'
        })

        if (!response.ok) {
            return null
        }

        const data = await response.json()
        return data.product
    } catch (error) {
        console.error('Error fetching product:', error)
        return null
    }
}

async function getRelatedProducts(categoryName: string, productId: string) {
    try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const response = await fetch(
            `${baseUrl}/api/products?category=${encodeURIComponent(categoryName)}&limit=6&exclude=${productId}`,
            { cache: 'no-store' }
        )

        if (!response.ok) {
            return []
        }

        const data = await response.json()
        return data.products?.filter((p: any) => p._id !== productId).slice(0, 6) || []
    } catch (error) {
        console.error('Error fetching related products:', error)
        return []
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const product = await getProduct(slug)

    if (!product) {
        return generateSEOMetadata({
            title: "Product Not Found",
            description: "The product you're looking for doesn't exist.",
            noIndex: true
        })
    }

    const categoryName = typeof product.category === 'object' ? product.category.name : product.category

    return generateSEOMetadata({
        title: `${product.name} | BeKaarCool`,
        description: product.description?.substring(0, 160) || `Shop ${product.name} at BeKaarCool`,
        keywords: [categoryName, product.brand, ...(product.tags || [])].filter(Boolean),
        image: product.images?.[0],
        url: `${process.env.NEXTAUTH_URL}/products/${product.slug}`,
        type: "product"
    })
}

export default async function ProductPage({ params }: Props) {
    const { slug } = await params
    const product = await getProduct(slug)

    if (!product) {
        notFound()
    }

    // Get category info for breadcrumb
    const categoryName = typeof product.category === 'object' ? product.category.name : product.category
    const categorySlug = typeof product.category === 'object' ? product.category.slug : product.category?.toLowerCase()

    // Fetch related products
    const relatedProducts = await getRelatedProducts(categoryName, product._id)

    const breadcrumbItems = [
        { name: "Home", url: "/" },
        { name: "Products", url: "/products" },
        { name: categoryName, url: `/products?category=${categorySlug}` },
        { name: product.name, url: `/products/${product.slug}` }
    ]

    return (
        <>
            <ProductDetailClient
                product={product}
                relatedProducts={relatedProducts}
            />

            <Script
                id="product-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(generateProductSchema({
                        ...product,
                        category: categoryName
                    }))
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
