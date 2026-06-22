"use client"

import { useEffect, useState } from "react"
import { RefreshCw, ScrollText, Search, ChevronDown, ChevronRight } from "lucide-react"
import * as adminApi from "@/lib/api/admin"
import type { AuditLogDto } from "@/lib/api/admin"

const ENTITY_TYPES = ["", "product", "order", "user", "variant", "coupon", "review", "return", "payment"]

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  approve: "bg-teal-100 text-teal-700",
  reject: "bg-orange-100 text-brand-600",
  refund: "bg-purple-100 text-purple-700",
}

const actionColor = (action: string) => {
  const key = Object.keys(ACTION_COLORS).find((k) => action.toLowerCase().includes(k))
  return key ? ACTION_COLORS[key] : "bg-gray-100 text-gray-600"
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogDto[]>([])
  const [loading, setLoading] = useState(true)
  const [entityType, setEntityType] = useState("")
  const [actorSearch, setActorSearch] = useState("")
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError("")
    try {
      const rows = await adminApi.adminAuditLogs({
        entityType: entityType || undefined,
        limit: 200,
      })
      setLogs(rows)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [entityType])

  const filtered = actorSearch
    ? logs.filter(
        (l) =>
          l.actorEmail?.toLowerCase().includes(actorSearch.toLowerCase()) ||
          l.actorId?.includes(actorSearch)
      )
    : logs

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })

  const formatJson = (str: string | undefined) => {
    if (!str) return null
    try { return JSON.stringify(JSON.parse(str), null, 2) } catch { return str }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 text-sm">{filtered.length} entries</p>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">{error}</div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 p-4 flex flex-col sm:flex-row gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Entity Type</label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Types</option>
            {ENTITY_TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Actor</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={actorSearch}
              onChange={(e) => setActorSearch(e.target.value)}
              placeholder="Email or actor ID..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <ScrollText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No audit logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((log) => {
              const isOpen = expanded === log.id
              const before = formatJson(log.before)
              const after = formatJson(log.after)
              const hasDiff = !!(before || after)
              return (
                <div key={log.id}>
                  <div
                    className={`flex items-start gap-4 px-4 py-3 hover:bg-gray-50 ${hasDiff ? "cursor-pointer" : ""}`}
                    onClick={() => hasDiff && setExpanded(isOpen ? null : log.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{log.entityType}</span>
                        <span className="font-mono text-xs text-gray-400">{log.entityId.slice(0, 12)}…</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                        {log.actorEmail ? (
                          <span>by <span className="text-gray-600">{log.actorEmail}</span></span>
                        ) : log.actorId ? (
                          <span>by <span className="font-mono">{log.actorId.slice(0, 8)}…</span></span>
                        ) : (
                          <span>system</span>
                        )}
                        {log.ip && <span>• {log.ip}</span>}
                        {log.reason && <span className="text-gray-500">• {log.reason}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(log.occurredAt)}</span>
                      {hasDiff && (
                        isOpen
                          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                          : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {isOpen && hasDiff && (
                    <div className="px-4 pb-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {before && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Before</p>
                          <pre className="text-xs font-mono bg-white border rounded p-3 overflow-auto max-h-48 text-gray-700">{before}</pre>
                        </div>
                      )}
                      {after && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">After</p>
                          <pre className="text-xs font-mono bg-white border rounded p-3 overflow-auto max-h-48 text-gray-700">{after}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
