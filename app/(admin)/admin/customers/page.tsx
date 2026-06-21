"use client"

import { useEffect, useState } from "react"
import { Search, RefreshCw, UserCircle, ChevronDown, ChevronRight, Mail } from "lucide-react"
import * as adminApi from "@/lib/api/admin"

type Customer = {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  status: string
  createdAt: string
}

const ROLE_COLORS: Record<string, string> = {
  customer: "bg-blue-100 text-blue-700",
  admin: "bg-red-100 text-red-700",
  manager: "bg-purple-100 text-purple-700",
  support: "bg-orange-100 text-[#D97706]",
  finance: "bg-green-100 text-green-700",
  content: "bg-indigo-100 text-indigo-700",
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
  pending: "bg-orange-100 text-[#D97706]",
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState("")

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const result = await adminApi.adminListCustomers()
      setCustomers(result)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCustomers() }, [])

  const toggleStatus = async (customer: Customer) => {
    const next = customer.status === "active" ? "suspended" : "active"
    setUpdating(customer.id)
    setError("")
    try {
      await adminApi.adminUpdateUser(customer.id, { status: next })
      setCustomers((prev) => prev.map((c) => c.id === customer.id ? { ...c, status: next } : c))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUpdating(null)
    }
  }

  const filtered = customers.filter((c) => {
    const fullName = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase()
    const matchSearch = !search || fullName.includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === "all" || c.role === roleFilter
    return matchSearch && matchRole
  })

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm">{customers.length} total</p>
        </div>
        <button onClick={fetchCustomers} className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
        >
          <option value="all">All Roles</option>
          {Object.keys(ROLE_COLORS).map((r) => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No customers found</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((customer) => {
              const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—"
              const isOpen = expanded === customer.id
              const busy = updating === customer.id
              return (
                <div key={customer.id}>
                  <div
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : customer.id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm">{name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[customer.role] ?? "bg-gray-100 text-gray-600"}`}>
                          {customer.role}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[customer.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {customer.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{customer.email}</p>
                    </div>
                    <span className="text-xs text-gray-400 hidden lg:block whitespace-nowrap">{formatDate(customer.createdAt)}</span>
                    {isOpen
                      ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    }
                  </div>
                  {isOpen && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                      <div className="mt-3 flex flex-col sm:flex-row gap-3 items-start">
                        <div className="flex-1 space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <a href={`mailto:${customer.email}`} className="hover:text-[#F38508]">{customer.email}</a>
                          </div>
                          <p className="text-xs text-gray-400">ID: <span className="font-mono">{customer.id}</span></p>
                          <p className="text-xs text-gray-400">Joined: {formatDate(customer.createdAt)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            disabled={busy}
                            onClick={(e) => { e.stopPropagation(); toggleStatus(customer) }}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                              customer.status === "active"
                                ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                                : "text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                            }`}
                          >
                            {busy ? "..." : customer.status === "active" ? "Suspend" : "Activate"}
                          </button>
                        </div>
                      </div>
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
