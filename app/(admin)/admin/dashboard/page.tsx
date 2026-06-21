"use client"

import { useEffect, useState } from "react"
import { Package, ShoppingBag, Users, TrendingUp, AlertCircle, Clock } from "lucide-react"
import * as adminApi from "@/lib/api/admin"
import type { AdminDashboardStats } from "@/lib/api/types"
import { minorToRupees } from "@/lib/api/config"

const StatCard = ({
  title, value, icon: Icon, color, sub,
}: { title: string; value: string | number; icon: any; color: string; sub?: string }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
)

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi.getAdminDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 flex items-center gap-3 text-red-600">
        <AlertCircle className="w-5 h-5" />
        <p>Failed to load stats: {error}</p>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time store overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Published Products"
          value={stats?.totalProducts ?? 0}
          icon={Package}
          color="bg-blue-500"
          sub="Active listings"
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon={ShoppingBag}
          color="bg-green-500"
          sub="All time"
        />
        <StatCard
          title="Customers"
          value={stats?.totalCustomers ?? 0}
          icon={Users}
          color="bg-purple-500"
          sub="Registered users"
        />
        <StatCard
          title="Revenue"
          value={`₹${minorToRupees(stats?.totalRevenueMinor ?? "0").toLocaleString("en-IN")}`}
          icon={TrendingUp}
          color="bg-yellow-500"
          sub="From delivered orders"
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders ?? 0}
          icon={Clock}
          color="bg-orange-500"
          sub="Awaiting action"
        />
        <StatCard
          title="Low Stock"
          value={stats?.lowStockVariants ?? 0}
          icon={AlertCircle}
          color="bg-red-500"
          sub="Variants < 10 units"
        />
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Product", href: "/admin/products/new", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
            { label: "Manage Orders", href: "/admin/orders", color: "bg-green-50 text-green-700 hover:bg-green-100" },
            { label: "Add Category", href: "/admin/categories", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
            { label: "View Inventory", href: "/admin/inventory", color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
          ].map((a) => (
            <a
              key={a.href}
              href={a.href}
              className={`${a.color} text-sm font-medium px-4 py-3 rounded-lg text-center transition-colors`}
            >
              {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
