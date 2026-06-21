"use client"

import { useEffect, useState } from "react"
import { UserCog, Plus, RefreshCw, Shield, CheckCircle, XCircle } from "lucide-react"
import * as adminApi from "@/lib/api/admin"
import type { StaffDto } from "@/lib/api/admin"

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-purple-100 text-purple-700",
  support: "bg-orange-100 text-[#D97706]",
  finance: "bg-green-100 text-green-700",
  content: "bg-indigo-100 text-indigo-700",
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
}

const ROLES = ["admin", "manager", "support", "finance", "content"]

const initForm = { email: "", password: "", role: "support", firstName: "", lastName: "" }

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffDto[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(initForm)
  const [creating, setCreating] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const fetchStaff = async () => {
    setLoading(true)
    try {
      setStaff(await adminApi.adminListStaff())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStaff() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError("")
    try {
      await adminApi.adminCreateStaff(form)
      setShowCreate(false)
      setForm(initForm)
      await fetchStaff()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleUpdate = async (id: string) => {
    setSaving(true)
    setError("")
    try {
      await adminApi.adminUpdateUser(id, { role: editRole, status: editStatus })
      setEditId(null)
      await fetchStaff()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (s: StaffDto) => {
    setEditId(s.id)
    setEditRole(s.role)
    setEditStatus(s.status)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff & RBAC</h1>
          <p className="text-gray-500 text-sm">{staff.length} staff members</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStaff} className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#F38508] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d97507]"
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Role guide */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {ROLES.map((role) => (
          <div key={role} className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1 ${ROLE_COLORS[role]}`}>{role}</span>
            <p className="text-xs text-gray-500">
              {role === "admin" && "Full access"}
              {role === "manager" && "Orders, products, staff"}
              {role === "support" && "Orders, returns, customers"}
              {role === "finance" && "Refunds, coupons"}
              {role === "content" && "Products, collections, reviews"}
            </p>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Staff Member</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-[#F38508] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#d97507] disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : staff.length === 0 ? (
          <div className="p-8 text-center">
            <UserCog className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No staff members yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">2FA</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Joined</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {[s.firstName, s.lastName].filter(Boolean).join(" ") || "—"}
                          </p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {editId === s.id ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[s.role] ?? "bg-gray-100 text-gray-600"}`}>
                          {s.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {editId === s.id ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {s.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {s.twoFactorEnabled ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editId === s.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditId(null)}
                            className="text-xs text-gray-500 border px-2 py-1 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdate(s.id)}
                            disabled={saving}
                            className="text-xs bg-[#F38508] text-white px-2 py-1 rounded disabled:opacity-60"
                          >
                            {saving ? "..." : "Save"}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(s)}
                          className="text-xs text-[#F38508] hover:underline"
                        >
                          Edit
                        </button>
                      )}
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
