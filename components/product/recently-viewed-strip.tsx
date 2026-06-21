"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRecentlyViewed, type RecentlyViewedProduct } from "@/hooks/use-recently-viewed"

interface RecentlyViewedStripProps {
  excludeId?: string
  title?: string
}

export function RecentlyViewedStrip({
  excludeId,
  title = "Recently Viewed",
}: RecentlyViewedStripProps) {
  const { get } = useRecentlyViewed()
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([])

  useEffect(() => {
    setProducts(get(excludeId))
  }, [get, excludeId])

  if (products.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide">
        {products.map((product) => {
          const discount =
            product.originalPrice && product.originalPrice > product.price
              ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
              : 0
          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="flex-shrink-0 w-36 sm:w-44 group"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-2">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="176px"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                )}
                {discount > 0 && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {discount}% OFF
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 line-clamp-1">{product.brandName || "Baefikra"}</p>
              <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{product.name}</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-sm font-bold text-gray-900">₹{product.price.toLocaleString("en-IN")}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs text-gray-400 line-through">₹{product.originalPrice.toLocaleString("en-IN")}</span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
