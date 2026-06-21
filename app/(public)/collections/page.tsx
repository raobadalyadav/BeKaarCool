import Link from "next/link"
import { listCollections } from "@/lib/api/products"
import type { CollectionDto } from "@/lib/api/types"

const TYPE_LABELS: Record<string, string> = {
  manual: "Curated",
  rule_based: "Smart",
  ip_licensed: "Licensed",
  tribe_exclusive: "Tribe Only",
}

const TYPE_COLORS: Record<string, string> = {
  manual: "bg-blue-100 text-blue-700",
  rule_based: "bg-purple-100 text-purple-700",
  ip_licensed: "bg-orange-100 text-orange-700",
  tribe_exclusive: "bg-orange-100 text-orange-800",
}

export const metadata = {
  title: "Collections | Baefikra",
  description: "Browse our curated collections — seasonal picks, licensed collaborations, and more.",
}

export default async function CollectionsPage() {
  let collections: CollectionDto[] = []
  try {
    collections = await listCollections()
    // Only show public collections
    collections = collections.filter((c) => c.visibility !== "hidden")
  } catch {}

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
        <p className="text-gray-500 mt-2">Shop our curated collections — from seasonal trends to licensed collaborations.</p>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No collections available yet.</p>
          <Link href="/products" className="text-[#F38508] font-semibold mt-2 inline-block hover:underline">
            Browse all products →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Placeholder banner */}
              <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-black text-gray-300 uppercase tracking-wider line-clamp-2 px-6 text-center">
                    {collection.name}
                  </span>
                </div>
                {collection.type === "tribe_exclusive" && (
                  <div className="absolute top-3 right-3 bg-[#F38508] text-black text-xs font-bold px-2 py-0.5 rounded">
                    TRIBE
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 text-lg group-hover:text-[#F38508] transition-colors line-clamp-1">
                    {collection.name}
                  </h2>
                  {collection.type && (
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_COLORS[collection.type] ?? "bg-gray-100 text-gray-600"}`}>
                      {TYPE_LABELS[collection.type] ?? collection.type}
                    </span>
                  )}
                </div>
                {collection.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{collection.description}</p>
                )}
                <p className="text-xs text-[#F38508] font-semibold mt-3 group-hover:underline">
                  Shop Now →
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
