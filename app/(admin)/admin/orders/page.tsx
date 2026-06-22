"use client"

import { useEffect, useState } from "react"
import { Search, RefreshCw } from "lucide-react"
import * as adminApi from "@/lib/api/admin"
import { minorToRupees } from "@/lib/api/config"

type Order = {
  id: string
  number: string
  status: string
  totalMinor: string
  placedAt: string
  userId: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-orange-100 text-brand-600",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
}

const TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [transitioning, setTransitioning] = useState<string | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const result = await adminApi.adminListOrders({ first: 200 })
      setOrders(result)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  const handleTransition = async (order: Order, to: string) => {
    setTransitioning(order.id)
    try {
      const updated = await adminApi.adminTransitionOrder(order.id, to)
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: updated.status } : o))
    } catch (e: any) {
      alert(e.message)
    } finally {
      setTransitioning(null)
    }
  }

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.number.toLowerCase().includes(search.toLowerCase()) || o.userId.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm">{orders.length} total</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number or user ID..."
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
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Order #</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order) => {
                  const nextStates = TRANSITIONS[order.status] ?? []
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">#{order.number || order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-400">{order.userId.slice(0, 12)}...</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(order.placedAt)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        ₹{minorToRupees(order.totalMinor).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {nextStates.map((to) => (
                            <button
                              key={to}
                              onClick={() => handleTransition(order, to)}
                              disabled={transitioning === order.id}
                              className="text-xs px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 capitalize"
                            >
                              → {to}
                            </button>
                          ))}
                          {nextStates.length === 0 && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
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
