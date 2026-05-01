import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  generateMetadata as generateSEOMetadata,
  generateProductSchema,
  generateBreadcrumbSchema,
} from "@/lib/seo";
import Script from "next/script";
import ProductDetailClient from "./product-detail-client";
import * as productsApi from "@/lib/api/products";
import { minorToRupees } from "@/lib/api/config";
import type { ProductDto } from "@/lib/api/types";

interface Props {
  params: Promise<{ slug: string }>;
}

const toUiProduct = (p: ProductDto) => {
  const v = p.variants?.[0];
  return {
    _id: p.id,
    id: p.id,
    name: p.title,
    title: p.title,
    slug: p.slug,
    description: p.descriptionHtml ?? "",
    price: v ? minorToRupees(v.priceMinor) : 0,
    originalPrice: v?.compareAtMinor ? minorToRupees(v.compareAtMinor) : undefined,
    images: p.images ?? [],
    category: p.categoryId ?? "",
    brand: p.brandId ?? "",
    rating: p.ratingAvg ?? 0,
    reviewCount: p.ratingCount ?? 0,
    variants: p.variants ?? [],
    defaultVariantId: v?.id,
    stock: v?.inStock ? 100 : 0,
    tags: [],
  };
};

async function getProduct(slug: string) {
  if (!slug || slug === "undefined" || slug === "null") return null;
  try {
    const product = await productsApi.getProductBySlug(slug);
    return product ? toUiProduct(product) : null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

async function getRelatedProducts(categoryId: string, productId: string) {
  if (!categoryId) return [];
  try {
    const conn = await productsApi.listProducts({
      first: 12,
      categoryId,
      status: "published",
    });
    return conn.edges
      .map((e) => toUiProduct(e.node))
      .filter((p) => p._id !== productId)
      .slice(0, 6);
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return generateSEOMetadata({
      title: "Product Not Found",
      description: "The product you're looking for doesn't exist.",
      noIndex: true,
    });
  }

  return generateSEOMetadata({
    title: `${product.name} | Baefikra`,
    description: product.description?.substring(0, 160) || `Shop ${product.name} at Baefikra`,
    keywords: [product.category, product.brand].filter(Boolean) as string[],
    image: product.images?.[0],
    url: `${process.env.NEXTAUTH_URL}/products/${product.slug}`,
    type: "product",
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, reviewsRaw, questionsRaw] = await Promise.all([
    getRelatedProducts(product.category, product._id),
    productsApi.productReviews(product._id).catch(() => []),
    productsApi.productQuestions(product._id).catch(() => []),
  ]);

  const reviews = reviewsRaw.map((r) => ({
    _id: r.id,
    rating: r.rating,
    title: r.title ?? "",
    comment: r.body ?? "",
    verified: r.verifiedPurchase,
    helpful: r.helpfulCount,
    notHelpful: r.notHelpfulCount,
    createdAt: r.createdAt ?? new Date().toISOString(),
    user: { name: r.reviewerName ?? "Anonymous" },
  }));

  const questions = questionsRaw.map((q) => ({
    id: q.id,
    question: q.question,
    upvotes: q.upvotes,
    createdAt: q.createdAt,
    answers: q.answers ?? [],
  }));

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
    { name: product.name, url: `/products/${product.slug}` },
  ];

  return (
    <>
      <ProductDetailClient
        product={{ ...product, reviews }}
        relatedProducts={relatedProducts}
        questions={questions}
      />

      <Script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateProductSchema({
              ...product,
              category: product.category,
            })
          ),
        }}
      />

      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)),
        }}
      />
    </>
  );
}
