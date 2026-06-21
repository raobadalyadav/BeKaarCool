"use client"

import { useEffect, useState } from "react"
import { RefreshCw, ToggleLeft, ToggleRight } from "lucide-react"
import * as adminApi from "@/lib/api/admin"
import { minorToRupees } from "@/lib/api/config"

type Coupon = {
  id: string
  code: string
  type: string
  valueMinor?: string
  percentBps?: number
  usageCount: number
  usageLimit?: number
  isActive: boolean
  startsAt?: string
  endsAt?: string
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const result = await adminApi.adminListCoupons()
      setCoupons(result)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCoupons() }, [])

  const handleToggle = async (coupon: Coupon) => {
    setToggling(coupon.id)
    try {
      await adminApi.adminToggleCoupon(coupon.id, !coupon.isActive)
      setCoupons((prev) =>
        prev.map((c) => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c)
      )
    } catch (e: any) {
      alert(e.message)
    } finally {
      setToggling(null)
    }
  }

  const formatValue = (c: Coupon) => {
    if (c.type === "percentage" && c.percentBps != null) {
      return `${(c.percentBps / 100).toFixed(0)}% off`
    }
    if (c.valueMinor) {
      return `₹${minorToRupees(c.valueMinor).toLocaleString("en-IN")} off`
    }
    return "—"
  }

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-gray-500 text-sm">{coupons.length} total · {coupons.filter((c) => c.isActive).length} active</p>
        </div>
        <button onClick={fetchCoupons} className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No coupons found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Discount</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Usage</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Valid</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs tracking-wider">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{formatValue(coupon)}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                      {formatDate(coupon.startsAt)} → {formatDate(coupon.endsAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${coupon.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleToggle(coupon)}
                          disabled={toggling === coupon.id}
                          className="p-1.5 disabled:opacity-50"
                          title={coupon.isActive ? "Deactivate" : "Activate"}
                        >
                          {coupon.isActive ? (
                            <ToggleRight className="w-6 h-6 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                          )}
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
