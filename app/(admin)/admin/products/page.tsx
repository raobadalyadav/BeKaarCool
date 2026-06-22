"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2, Search, AlertCircle, Eye } from "lucide-react"
import * as adminApi from "@/lib/api/admin"
import type { ProductDto } from "@/lib/api/types"
import { minorToRupees } from "@/lib/api/config"

const STATUS_COLORS: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-600",
  archived: "bg-red-100 text-red-700",
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const conn = await adminApi.adminListProducts({ first: 200 })
      setProducts(conn.edges.map((e) => e.node))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await adminApi.adminDeleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (e: any) {
      alert("Delete failed: " + e.message)
    } finally {
      setDeleting(null)
    }
  }

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || p.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">{products.length} total products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 mb-4 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No products found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Price</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Variants</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => {
                  const firstVariant = p.variants[0]
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.images[0] ? (
                            <img src={p.images[0]} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{p.title}</p>
                            <p className="text-xs text-gray-400">{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[p.status] ?? ""}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-700">
                        {firstVariant
                          ? `₹${minorToRupees(firstVariant.priceMinor).toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-500">
                        {p.variants.length}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/products/${p.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                            title="View on site"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="p-1.5 text-blue-500 hover:text-blue-700 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.title)}
                            disabled={deleting === p.id}
                            className="p-1.5 text-red-400 hover:text-red-600 rounded disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
