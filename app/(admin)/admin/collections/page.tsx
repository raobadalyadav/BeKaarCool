"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Trash2, Package, X, Search } from "lucide-react"
import * as adminApi from "@/lib/api/admin"
import type { CollectionDto, ProductDto } from "@/lib/api/types"

type Collection = { id: string; slug: string; name: string; type: string; visibility: string }

const TYPE_COLORS: Record<string, string> = {
  manual: "bg-blue-100 text-blue-700",
  rule_based: "bg-purple-100 text-purple-700",
  ip_licensed: "bg-orange-100 text-orange-700",
  tribe_exclusive: "bg-yellow-100 text-yellow-700",
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: "", slug: "", type: "manual" })
  const [saving, setSaving] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [products, setProducts] = useState<ProductDto[]>([])
  const [collectionProducts, setCollectionProducts] = useState<ProductDto[]>([])
  const [productSearch, setProductSearch] = useState("")

  const fetchCollections = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminApi.adminListCollections()
      setCollections(result)
    } catch (e: any) { alert(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCollections() }, [fetchCollections])

  const handleNameChange = (v: string) => {
    setForm((f) => ({
      ...f,
      name: v,
      slug: f.slug || v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }))
  }

  const handleCreate = async () => {
    if (!form.name || !form.slug) return
    setSaving(true)
    try {
      const created = await adminApi.adminCreateCollection(form)
      setCollections((prev) => [...prev, { ...created, visibility: "public" }])
      setForm({ name: "", slug: "", type: "manual" })
      setShowCreate(false)
    } catch (e: any) { alert(e.message) }
    finally { setSaving(false) }
  }

  const openManageProducts = async (col: Collection) => {
    setSelectedCollection(col)
    setProductSearch("")
    const conn = await adminApi.adminListProducts({ first: 200 })
    setProducts(conn.edges.map((e) => e.node))
    setCollectionProducts([])
  }

  const handleAddProduct = async (product: ProductDto) => {
    if (!selectedCollection) return
    try {
      await adminApi.adminAddProductToCollection(selectedCollection.id, product.id)
      setCollectionProducts((prev) => [...prev, product])
    } catch (e: any) { alert(e.message) }
  }

  const handleRemoveProduct = async (product: ProductDto) => {
    if (!selectedCollection) return
    try {
      await adminApi.adminRemoveProductFromCollection(selectedCollection.id, product.id)
      setCollectionProducts((prev) => prev.filter((p) => p.id !== product.id))
    } catch (e: any) { alert(e.message) }
  }

  const availableProducts = products.filter((p) => {
    const inCollection = collectionProducts.some((cp) => cp.id === p.id)
    if (inCollection) return false
    if (!productSearch) return true
    return p.title.toLowerCase().includes(productSearch.toLowerCase())
  })

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-500 text-sm">{collections.length} total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" /> New Collection
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">New Collection</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g. Summer Essentials"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="summer-essentials"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="manual">Manual</option>
                  <option value="rule_based">Rule-based</option>
                  <option value="ip_licensed">IP Licensed</option>
                  <option value="tribe_exclusive">Tribe Exclusive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create"}
              </button>
              <button onClick={() => setShowCreate(false)} className="flex-1 border py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Products modal */}
      {selectedCollection && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Manage Products — {selectedCollection.name}</h2>
              <button onClick={() => setSelectedCollection(null)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 flex gap-4 flex-1 overflow-hidden">
              {/* Available products */}
              <div className="flex-1 flex flex-col min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Add products</p>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 pr-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                </div>
                <div className="overflow-y-auto flex-1 space-y-1">
                  {availableProducts.slice(0, 50).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleAddProduct(p)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded hover:bg-yellow-50 text-sm"
                    >
                      {p.images[0] ? (
                        <img src={p.images[0]} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-7 bg-gray-200 rounded flex-shrink-0" />
                      )}
                      <span className="line-clamp-1 text-gray-800">{p.title}</span>
                      <Plus className="w-3.5 h-3.5 text-gray-400 ml-auto flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* In collection */}
              <div className="flex-1 flex flex-col min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  In collection ({collectionProducts.length})
                </p>
                <div className="overflow-y-auto flex-1 space-y-1">
                  {collectionProducts.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">No products added yet</p>
                  )}
                  {collectionProducts.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-green-50 text-sm">
                      {p.images[0] ? (
                        <img src={p.images[0]} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-7 bg-gray-200 rounded flex-shrink-0" />
                      )}
                      <span className="line-clamp-1 text-gray-800 flex-1">{p.title}</span>
                      <button onClick={() => handleRemoveProduct(p)}>
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collections grid */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : collections.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No collections yet.</div>
        ) : (
          <div className="divide-y">
            {collections.map((col) => (
              <div key={col.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{col.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TYPE_COLORS[col.type] ?? "bg-gray-100 text-gray-600"}`}>
                      {col.type?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono">{col.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openManageProducts(col)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 border rounded hover:bg-gray-100 text-gray-600"
                  >
                    <Package className="w-3.5 h-3.5" /> Manage Products
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
