"use client"

import { useEffect, useState } from "react"
import { RefreshCw, PackageCheck, PackageX, Truck, BadgeDollarSign } from "lucide-react"
import * as adminApi from "@/lib/api/admin"
import type { AdminReturnDto } from "@/lib/api/admin"

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  picked_up: "bg-purple-100 text-purple-700",
  received: "bg-indigo-100 text-indigo-700",
  refunded: "bg-green-100 text-green-700",
}

const STATUS_FILTERS = ["all", "requested", "approved", "rejected", "picked_up", "received", "refunded"]

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<AdminReturnDto[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [processing, setProcessing] = useState<string | null>(null)
  const [refundModal, setRefundModal] = useState<AdminReturnDto | null>(null)
  const [refundAmount, setRefundAmount] = useState("")

  const fetchReturns = async () => {
    setLoading(true)
    setError("")
    try {
      const rows = await adminApi.adminListReturns(statusFilter === "all" ? undefined : statusFilter)
      setReturns(rows)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReturns() }, [statusFilter])

  const act = async (fn: () => Promise<unknown>, returnId: string) => {
    setProcessing(returnId)
    setActionError("")
    try {
      await fn()
      await fetchReturns()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleRefund = async () => {
    if (!refundModal || !refundAmount) return
    setProcessing(refundModal.id)
    try {
      const minor = String(Math.round(parseFloat(refundAmount) * 100))
      await adminApi.adminRefundReturn(refundModal.id, minor)
      setRefundModal(null)
      setRefundAmount("")
      await fetchReturns()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returns</h1>
          <p className="text-gray-500 text-sm">{returns.length} returns</p>
        </div>
        <button onClick={fetchReturns} className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">{error}</div>
      )}
      {actionError && (
        <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">{actionError}</div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? "bg-brand-500 text-white"
                : "bg-white border text-gray-600 hover:border-brand-500 hover:text-brand-500"
            }`}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : returns.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No returns found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Return ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Order</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Reason</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Requested</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {returns.map((ret) => {
                  const busy = processing === ret.id
                  return (
                    <tr key={ret.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {ret.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">#{ret.orderNumber ?? "—"}</p>
                        {ret.userId && <p className="text-xs text-gray-400">{ret.userId.slice(0, 8)}…</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[ret.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {ret.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[180px] truncate hidden md:table-cell">
                        {ret.reason ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                        {formatDate(ret.requestedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1 flex-wrap">
                          {ret.status === "requested" && (
                            <>
                              <button
                                disabled={busy}
                                onClick={() => act(() => adminApi.adminApproveReturn(ret.id), ret.id)}
                                className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50"
                              >
                                <PackageCheck className="w-3 h-3" /> Approve
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => act(() => adminApi.adminRejectReturn(ret.id), ret.id)}
                                className="flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded hover:bg-red-100 disabled:opacity-50"
                              >
                                <PackageX className="w-3 h-3" /> Reject
                              </button>
                            </>
                          )}
                          {ret.status === "approved" && (
                            <button
                              disabled={busy}
                              onClick={() => act(() => adminApi.adminMarkReturnPickedUp(ret.id), ret.id)}
                              className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-1 rounded hover:bg-purple-100 disabled:opacity-50"
                            >
                              <Truck className="w-3 h-3" /> Picked Up
                            </button>
                          )}
                          {(ret.status === "picked_up" || ret.status === "received") && (
                            <button
                              disabled={busy}
                              onClick={() => { setRefundModal(ret); setRefundAmount("") }}
                              className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-100 disabled:opacity-50"
                            >
                              <BadgeDollarSign className="w-3 h-3" /> Refund
                            </button>
                          )}
                          {["refunded", "rejected"].includes(ret.status) && (
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

      {/* Refund modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Issue Refund</h2>
              <button onClick={() => setRefundModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Return <span className="font-mono">{refundModal.id.slice(0, 8)}…</span> for Order <span className="font-semibold">#{refundModal.orderNumber ?? "—"}</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="e.g. 499.00"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              {actionError && <p className="text-red-600 text-sm">{actionError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => setRefundModal(null)}
                  className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  disabled={!refundAmount || processing === refundModal.id}
                  className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-60"
                >
                  Issue Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
