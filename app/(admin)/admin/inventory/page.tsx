"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Plus, Minus, RefreshCw } from "lucide-react"
import * as adminApi from "@/lib/api/admin"
import type { ProductDto } from "@/lib/api/types"

type StockEntry = {
  variantId: string
  sku: string
  productTitle: string
  optionsLabel: string
  onHand: number
  reserved: number
  available: number
}

export default function AdminInventoryPage() {
  const [entries, setEntries] = useState<StockEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [adjusting, setAdjusting] = useState<string | null>(null)
  const [adjModal, setAdjModal] = useState<{ variantId: string; sku: string } | null>(null)
  const [adjDelta, setAdjDelta] = useState("")
  const [adjReason, setAdjReason] = useState("")
  const [adjSaving, setAdjSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const conn = await adminApi.adminListProducts({ first: 200 })
      const products: ProductDto[] = conn.edges.map((e) => e.node)
      const variantIds = products.flatMap((p) => p.variants.map((v) => v.id))
      if (variantIds.length === 0) { setEntries([]); setLoading(false); return }
      const stocks = await adminApi.getStockFor(variantIds)
      const stockMap = Object.fromEntries(stocks.map((s) => [s.variantId, s]))
      const result: StockEntry[] = []
      for (const product of products) {
        for (const variant of product.variants) {
          const s = stockMap[variant.id]
          let optionsLabel = ""
          try {
            const opts = JSON.parse(variant.optionsJson || "{}")
            optionsLabel = Object.values(opts).join(" / ")
          } catch {}
          result.push({
            variantId: variant.id,
            sku: variant.sku,
            productTitle: product.title,
            optionsLabel,
            onHand: s?.onHand ?? 0,
            reserved: s?.reserved ?? 0,
            available: s?.available ?? 0,
          })
        }
      }
      setEntries(result)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openAdjust = (e: StockEntry) => {
    setAdjModal({ variantId: e.variantId, sku: e.sku })
    setAdjDelta("")
    setAdjReason("")
  }

  const handleAdjust = async () => {
    if (!adjModal || !adjDelta || !adjReason) return
    const delta = parseInt(adjDelta, 10)
    if (isNaN(delta)) return
    setAdjSaving(true)
    try {
      await adminApi.adminAdjustInventory(adjModal.variantId, delta, adjReason)
      setEntries((prev) =>
        prev.map((e) =>
          e.variantId === adjModal.variantId
            ? { ...e, onHand: e.onHand + delta, available: e.available + delta }
            : e
        )
      )
      setAdjModal(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setAdjSaving(false)
    }
  }

  const filtered = entries.filter((e) =>
    !search ||
    e.productTitle.toLowerCase().includes(search.toLowerCase()) ||
    e.sku.toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = filtered.filter((e) => e.available < 10)

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm">{entries.length} variants · {lowStock.length} low stock</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {adjModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold mb-1">Adjust Stock</h2>
            <p className="text-sm text-gray-500 mb-4 font-mono">{adjModal.sku}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delta (+ add / - remove)</label>
                <input
                  type="number"
                  value={adjDelta}
                  onChange={(e) => setAdjDelta(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g. 10 or -5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <input
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g. New stock received"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAdjust}
                disabled={adjSaving}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {adjSaving ? "Saving..." : "Apply"}
              </button>
              <button onClick={() => setAdjModal(null)} className="flex-1 border py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading inventory...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No variants found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Product / SKU</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">On Hand</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Reserved</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Available</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((e) => (
                  <tr key={e.variantId} className={`hover:bg-gray-50 ${e.available < 5 ? "bg-red-50" : e.available < 10 ? "bg-yellow-50" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 line-clamp-1">{e.productTitle}</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {e.sku}{e.optionsLabel ? ` · ${e.optionsLabel}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{e.onHand}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{e.reserved}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${e.available < 5 ? "text-red-600" : e.available < 10 ? "text-yellow-600" : "text-green-600"}`}>
                        {e.available}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openAdjust(e)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 border rounded hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" /><Minus className="w-3 h-3" /> Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
