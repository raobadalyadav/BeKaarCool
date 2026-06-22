import { notFound } from "next/navigation"
import Link from "next/link"
import { getCollectionBySlug } from "@/lib/api/products"
import { ProductCard } from "@/components/product/product-card"
import { listCategories, listBrands } from "@/lib/api/products"

function toUiProduct(node: any, categories: any[], brands: any[]) {
  const categoryName = categories.find((c) => c.id === node.categoryId)?.name
  const brandName = brands.find((b) => b.id === node.brandId)?.name
  const firstVariant = node.variants?.[0]
  const price = firstVariant ? Math.round(Number(firstVariant.priceMinor) / 100) : 0
  const originalPrice = firstVariant?.compareAtMinor
    ? Math.round(Number(firstVariant.compareAtMinor) / 100)
    : price
  return {
    _id: node.id,
    id: node.id,
    slug: node.slug,
    name: node.title,
    title: node.title,
    price,
    originalPrice,
    images: node.images ?? [],
    rating: Number(node.ratingAvg ?? 0),
    reviewCount: node.ratingCount ?? 0,
    brandName: /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(brandName ?? "") ? "Baefikra" : brandName || "Baefikra",
    categoryName: /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(categoryName ?? "") ? undefined : categoryName,
    variants: node.variants ?? [],
    inStock: node.variants?.some((v: any) => v.inStock) ?? true,
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const col = await getCollectionBySlug(params.slug).catch(() => null)
  if (!col) return { title: "Collection Not Found" }
  return {
    title: `${col.name} | Baefikra`,
    description: col.description || `Shop the ${col.name} collection at Baefikra.`,
  }
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const [collection, categories, brands] = await Promise.all([
    getCollectionBySlug(params.slug).catch(() => null),
    listCategories().catch(() => []),
    listBrands().catch(() => []),
  ])

  if (!collection) notFound()

  const products = (collection.products?.edges ?? []).map((e: any) =>
    toUiProduct(e.node, categories, brands)
  )

  const TYPE_LABELS: Record<string, string> = {
    manual: "Curated",
    rule_based: "Smart Collection",
    ip_licensed: "Licensed Collection",
    tribe_exclusive: "Tribe Exclusive",
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span>/</span>
        <Link href="/collections" className="hover:text-gray-600">Collections</Link>
        <span>/</span>
        <span className="text-gray-600">{collection.name}</span>
      </nav>

      {/* Hero */}
      <div className="mb-8 pb-8 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {collection.type && collection.type !== "manual" && (
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-medium">
                  {TYPE_LABELS[collection.type] ?? collection.type}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{collection.name}</h1>
            {collection.description && (
              <p className="text-gray-500 mt-2 max-w-2xl">{collection.description}</p>
            )}
          </div>
          <p className="text-sm text-gray-400 self-end">{products.length} products</p>
        </div>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No products in this collection yet.</p>
          <Link href="/products" className="text-brand-500 font-semibold mt-2 inline-block hover:underline">
            Browse all products →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {products.map((product: any) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
