"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Plus, Minus, RefreshCw, AlertTriangle } from "lucide-react"
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

type LedgerEntry = {
  id: string
  variantId: string
  sku?: string
  productTitle?: string
  delta: number
  field: string
  reason: string
  referenceType?: string
  referenceId?: string
  createdAt: string
}

type LowStockEntry = {
  variantId: string
  available: number
  sku?: string
  productTitle?: string
  optionsLabel?: string
  onHand: number
  reserved: number
}

type Tab = "stock" | "lowstock" | "logs"

export default function AdminInventoryPage() {
  const [tab, setTab] = useState<Tab>("stock")

  // Stock Management
  const [entries, setEntries] = useState<StockEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [adjModal, setAdjModal] = useState<{ variantId: string; sku: string } | null>(null)
  const [adjDelta, setAdjDelta] = useState("")
  const [adjReason, setAdjReason] = useState("")
  const [adjSaving, setAdjSaving] = useState(false)

  // Low Stock
  const [lowStock, setLowStock] = useState<LowStockEntry[]>([])
  const [lowStockLoading, setLowStockLoading] = useState(false)
  const [lowStockLoaded, setLowStockLoaded] = useState(false)

  // Ledger
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [ledgerLoading, setLedgerLoading] = useState(false)
  const [ledgerLoaded, setLedgerLoaded] = useState(false)
  const [skuFilter, setSkuFilter] = useState("")
  const [skuInput, setSkuInput] = useState("")

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

  const loadLowStock = useCallback(async () => {
    setLowStockLoading(true)
    try {
      const result = await adminApi.adminLowStockVariants(10)
      setLowStock(result)
      setLowStockLoaded(true)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLowStockLoading(false)
    }
  }, [])

  const loadLedger = useCallback(async (variantId?: string) => {
    setLedgerLoading(true)
    try {
      const result = await adminApi.adminInventoryLedger(variantId, 100)
      setLedger(result)
      setLedgerLoaded(true)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLedgerLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (tab === "lowstock" && !lowStockLoaded) loadLowStock()
    if (tab === "logs" && !ledgerLoaded) loadLedger()
  }, [tab, lowStockLoaded, ledgerLoaded, loadLowStock, loadLedger])

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

  const handleSkuSearch = () => {
    const trimmed = skuInput.trim()
    setSkuFilter(trimmed)
    // find variantId by sku in entries
    const match = entries.find((e) => e.sku.toLowerCase() === trimmed.toLowerCase())
    loadLedger(match?.variantId)
  }

  const filtered = entries.filter((e) =>
    !search ||
    e.productTitle.toLowerCase().includes(search.toLowerCase()) ||
    e.sku.toLowerCase().includes(search.toLowerCase())
  )

  const lowStockCount = entries.filter((e) => e.available < 10).length
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "stock", label: "Stock Management" },
    { id: "lowstock", label: "Low Stock Alerts", badge: lowStockLoaded ? lowStock.length : lowStockCount },
    { id: "logs", label: "Inventory Logs" },
  ]

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm">{entries.length} variants · {lowStockCount} low stock</p>
        </div>
        <button
          onClick={() => {
            load()
            if (tab === "lowstock") { setLowStockLoaded(false); loadLowStock() }
            if (tab === "logs") { setLedgerLoaded(false); loadLedger(skuFilter ? entries.find((e) => e.sku.toLowerCase() === skuFilter.toLowerCase())?.variantId : undefined) }
          }}
          className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b pb-0">
        {TABS.map(({ id, label, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border transition-colors ${
              tab === id
                ? "bg-white border-b-white text-[#F38508] border-[#F38508] border-b-2"
                : "bg-gray-50 border-transparent text-gray-600 hover:text-gray-900 hover:bg-white"
            }`}
          >
            {label}
            {badge !== undefined && badge > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === id ? "bg-[#F38508]/10 text-[#F38508]" : "bg-gray-200 text-gray-600"}`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Adjust Modal */}
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
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  placeholder="e.g. 10 or -5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <input
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  placeholder="e.g. New stock received"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAdjust}
                disabled={adjSaving}
                className="flex-1 bg-[#F38508] hover:bg-[#D97706] text-black font-semibold py-2 rounded-lg text-sm disabled:opacity-50"
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

      {/* ── Tab: Stock Management ── */}
      {tab === "stock" && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
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
                      <tr key={e.variantId} className={`hover:bg-gray-50 ${e.available < 5 ? "bg-red-50" : e.available < 10 ? "bg-orange-50" : ""}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 line-clamp-1">{e.productTitle}</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {e.sku}{e.optionsLabel ? ` · ${e.optionsLabel}` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">{e.onHand}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{e.reserved}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${e.available < 5 ? "text-red-600" : e.available < 10 ? "text-[#F38508]" : "text-green-600"}`}>
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
        </>
      )}

      {/* ── Tab: Low Stock Alerts ── */}
      {tab === "lowstock" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {lowStockLoading ? (
            <div className="p-8 text-center text-gray-400">Loading low stock data...</div>
          ) : lowStock.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              No variants below threshold
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Product / SKU</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">On Hand</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Reserved</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Available</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lowStock.map((e) => (
                    <tr key={e.variantId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1">{e.productTitle ?? "Unknown"}</p>
                        <p className="text-xs text-gray-500 font-mono">
                          {e.sku ?? e.variantId}{e.optionsLabel ? ` · ${e.optionsLabel}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">{e.onHand}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{e.reserved}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${e.available < 5 ? "text-red-600" : "text-[#F38508]"}`}>
                          {e.available}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          e.available <= 0
                            ? "bg-red-100 text-red-700"
                            : e.available < 5
                            ? "bg-red-50 text-red-600"
                            : "bg-orange-50 text-[#D97706]"
                        }`}>
                          {e.available <= 0 ? "Out of Stock" : e.available < 5 ? "Critical" : "Low Stock"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Inventory Logs ── */}
      {tab === "logs" && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by SKU (press Enter or click Search)"
                  value={skuInput}
                  onChange={(e) => setSkuInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSkuSearch() }}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                />
              </div>
              <button
                onClick={handleSkuSearch}
                className="px-4 py-2 bg-[#F38508] text-black font-medium rounded-lg text-sm hover:bg-[#D97706]"
              >
                Search
              </button>
              {skuFilter && (
                <button
                  onClick={() => { setSkuInput(""); setSkuFilter(""); loadLedger(undefined) }}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </div>
            {skuFilter && (
              <p className="text-xs text-gray-500 mt-2">Showing logs for SKU: <span className="font-mono font-medium">{skuFilter}</span></p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {ledgerLoading ? (
              <div className="p-8 text-center text-gray-400">Loading ledger...</div>
            ) : ledger.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No ledger entries found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">SKU</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Field</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Delta</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Reason</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ledger.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(e.createdAt)}</td>
                        <td className="px-4 py-3">
                          <p className="text-gray-800 font-medium line-clamp-1">{e.productTitle ?? "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{e.sku ?? "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{e.field}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold text-sm ${e.delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {e.delta >= 0 ? `+${e.delta}` : e.delta}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{e.reason}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                          {e.referenceType ? `${e.referenceType}${e.referenceId ? ` · ${e.referenceId.slice(0, 8)}...` : ""}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
