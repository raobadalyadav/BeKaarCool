"use client"

import { useEffect, useState } from "react"
import { Plus, Edit2, Trash2, ChevronRight } from "lucide-react"
import * as adminApi from "@/lib/api/admin"
import * as productsApi from "@/lib/api/products"
import type { CategoryDto } from "@/lib/api/types"

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CategoryDto | null>(null)
  const [form, setForm] = useState({ name: "", slug: "", parentId: "" })
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fetchCategories = async () => {
    const cats = await productsApi.listCategories()
    setCategories(cats)
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ name: "", slug: "", parentId: "" })
    setShowForm(true)
  }

  const openEdit = (c: CategoryDto) => {
    setEditing(c)
    setForm({ name: c.name, slug: c.slug, parentId: c.parentId ?? "" })
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
        const updated = await adminApi.adminUpdateCategory(editing.id, {
          name: form.name,
          slug: form.slug,
          parentId: form.parentId || undefined,
        })
        setCategories((prev) => prev.map((c) => c.id === editing.id ? updated : c))
      } else {
        const created = await adminApi.adminCreateCategory({
          name: form.name,
          slug: form.slug,
          parentId: form.parentId || undefined,
        })
        setCategories((prev) => [...prev, created])
      }
      setShowForm(false)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c: CategoryDto) => {
    if (!confirm(`Delete category "${c.name}"?`)) return
    try {
      await adminApi.adminDeleteCategory(c.id)
      setCategories((prev) => prev.filter((x) => x.id !== c.id))
    } catch (e: any) {
      alert(e.message)
    }
  }

  const topLevel = categories.filter((c) => !c.parentId)
  const getChildren = (parentId: string) => categories.filter((c) => c.parentId === parentId)

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm">{categories.length} total</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#F38508] hover:bg-[#D97706] text-black font-semibold px-4 py-2 rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editing ? "Edit Category" : "New Category"}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  placeholder="e.g. T-Shirts"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  placeholder="t-shirts"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                >
                  <option value="">— None (Top Level) —</option>
                  {topLevel.filter((c) => c.id !== editing?.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
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
            {topLevel.map((cat) => (
              <div key={cat.id}>
                <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(cat)} className="p-1.5 text-blue-500 hover:text-blue-700">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cat)} className="p-1.5 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {getChildren(cat.id).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 ml-6 border-l-2 border-gray-200">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{sub.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{sub.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(sub)} className="p-1.5 text-blue-500 hover:text-blue-700">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(sub)} className="p-1.5 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {topLevel.length === 0 && (
              <div className="p-8 text-center text-gray-400">No categories yet. Create your first one!</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
