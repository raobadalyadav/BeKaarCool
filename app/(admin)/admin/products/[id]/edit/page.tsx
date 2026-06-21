"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { ProductForm } from "../../_components/product-form"
import * as adminApi from "@/lib/api/admin"
import type { ProductDto } from "@/lib/api/types"

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<ProductDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.adminListProducts({ first: 200 })
      .then((conn) => {
        const found = conn.edges.find((e) => e.node.id === id)
        setProduct(found?.node ?? null)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Product not found.</p>
        <Link href="/admin/products" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          Back to products
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-500 text-sm">{product.title}</p>
        </div>
      </div>
      <ProductForm product={product} />
    </div>
  )
}
