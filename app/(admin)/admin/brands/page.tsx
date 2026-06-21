"use client"

import { useEffect, useState } from "react"
import { Plus, Edit2, Trash2 } from "lucide-react"
import * as adminApi from "@/lib/api/admin"
import * as productsApi from "@/lib/api/products"
import type { BrandDto } from "@/lib/api/types"

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandDto[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<BrandDto | null>(null)
  const [form, setForm] = useState({ name: "", slug: "" })
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fetchBrands = async () => {
    const result = await productsApi.listBrands()
    setBrands(result)
    setLoading(false)
  }

  useEffect(() => { fetchBrands() }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ name: "", slug: "" })
    setShowForm(true)
  }

  const openEdit = (b: BrandDto) => {
    setEditing(b)
    setForm({ name: b.name, slug: b.slug })
    setShowForm(true)
  }

  const handleNameChange = (v: string) => {
    setForm((f) => ({
      ...f,
      name: v,
      slug: editing ? f.slug : v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }))
  }

  const handleSave = async () => {
    if (!form.name || !form.slug) return
    setSaving(true)
    try {
      if (editing) {
        const updated = await adminApi.adminUpdateBrand(editing.id, { name: form.name, slug: form.slug })
        setBrands((prev) => prev.map((b) => b.id === editing.id ? updated : b))
      } else {
        const created = await adminApi.adminCreateBrand({ name: form.name, slug: form.slug })
        setBrands((prev) => [...prev, created])
      }
      setShowForm(false)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (b: BrandDto) => {
    if (!confirm(`Delete brand "${b.name}"?`)) return
    try {
      await adminApi.adminDeleteBrand(b.id)
      setBrands((prev) => prev.filter((x) => x.id !== b.id))
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-500 text-sm">{brands.length} total</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#F38508] hover:bg-[#D97706] text-black font-semibold px-4 py-2 rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" /> Add Brand
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editing ? "Edit Brand" : "New Brand"}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  placeholder="e.g. Nike"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  placeholder="nike"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#F38508] hover:bg-[#D97706] text-black font-semibold py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="divide-y">
            {brands.map((brand) => (
              <div key={brand.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{brand.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{brand.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(brand)} className="p-1.5 text-blue-500 hover:text-blue-700">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(brand)} className="p-1.5 text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {brands.length === 0 && (
              <div className="p-8 text-center text-gray-400">No brands yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
