"use client"

import { useEffect, useState, useCallback } from "react"
import { RefreshCw, TrendingUp, ShoppingBag, Users, Package } from "lucide-react"
import * as adminApi from "@/lib/api/admin"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

type SalesDay = {
  date: string
  totalMinor: string
  orderCount: number
}

type ProductStat = {
  productId: string
  productTitle: string
  unitsSold: number
  revenueMinor: string
}

type CustomerStats = {
  totalCustomers: number
  newThisMonth: number
  returningCount: number
  ordersThisMonth: number
}

type SalesTab = "sales" | "products" | "customers"

function fmt(minor: string | number) {
  const n = Number(minor)
  return `₹${(n / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className="p-2.5 bg-brand-500/10 rounded-lg flex-shrink-0">
        <Icon className="w-5 h-5 text-brand-500" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [tab, setTab] = useState<SalesTab>("sales")
  const [days, setDays] = useState(30)

  // Sales
  const [salesData, setSalesData] = useState<SalesDay[]>([])
  const [salesLoading, setSalesLoading] = useState(false)

  // Products
  const [productData, setProductData] = useState<ProductStat[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsLoaded, setProductsLoaded] = useState(false)

  // Customers
  const [customerData, setCustomerData] = useState<CustomerStats | null>(null)
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customersLoaded, setCustomersLoaded] = useState(false)

  const loadSales = useCallback(async (d: number) => {
    setSalesLoading(true)
    try {
      const result = await adminApi.adminSalesReport(d)
      setSalesData(result)
    } catch (e: any) { alert(e.message) }
    finally { setSalesLoading(false) }
  }, [])

  const loadProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const result = await adminApi.adminProductAnalytics(10)
      setProductData(result)
      setProductsLoaded(true)
    } catch (e: any) { alert(e.message) }
    finally { setProductsLoading(false) }
  }, [])

  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true)
    try {
      const result = await adminApi.adminCustomerAnalytics()
      setCustomerData(result)
      setCustomersLoaded(true)
    } catch (e: any) { alert(e.message) }
    finally { setCustomersLoading(false) }
  }, [])

  useEffect(() => { loadSales(days) }, [days, loadSales])

  useEffect(() => {
    if (tab === "products" && !productsLoaded) loadProducts()
    if (tab === "customers" && !customersLoaded) loadCustomers()
  }, [tab, productsLoaded, customersLoaded, loadProducts, loadCustomers])

  // Sales summary stats
  const totalRevenue = salesData.reduce((s, d) => s + Number(d.totalMinor), 0)
  const totalOrders = salesData.reduce((s, d) => s + d.orderCount, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Chart data
  const chartData = salesData.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    revenue: Number(d.totalMinor) / 100,
    orders: d.orderCount,
  }))

  const TABS: { id: SalesTab; label: string }[] = [
    { id: "sales", label: "Sales" },
    { id: "products", label: "Products" },
    { id: "customers", label: "Customers" },
  ]

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm">Business performance overview</p>
        </div>
        <button
          onClick={() => {
            if (tab === "sales") loadSales(days)
            if (tab === "products") { setProductsLoaded(false); loadProducts() }
            if (tab === "customers") { setCustomersLoaded(false); loadCustomers() }
          }}
          className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border transition-colors ${
              tab === id
                ? "bg-white border-b-white text-brand-500 border-brand-500 border-b-2"
                : "bg-gray-50 border-transparent text-gray-600 hover:text-gray-900 hover:bg-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Sales Tab ── */}
      {tab === "sales" && (
        <>
          {/* Day range buttons */}
          <div className="flex gap-2 mb-6">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  days === d
                    ? "bg-brand-500 text-black border-brand-500"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard icon={TrendingUp} label={`Total Revenue (${days}d)`} value={fmt(totalRevenue)} />
            <StatCard icon={ShoppingBag} label={`Total Orders (${days}d)`} value={totalOrders} />
            <StatCard icon={TrendingUp} label="Avg Order Value" value={fmt(avgOrderValue)} />
          </div>

          {/* Bar chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Daily Revenue (₹)</h2>
            {salesLoading ? (
              <div className="h-56 flex items-center justify-center text-gray-400">Loading chart...</div>
            ) : chartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400">No data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#C98B74" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Daily breakdown table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-base font-semibold text-gray-800">Daily Breakdown</h2>
            </div>
            {salesLoading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : salesData.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No data for this period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-6 py-3 font-semibold text-gray-600">Date</th>
                      <th className="text-center px-6 py-3 font-semibold text-gray-600">Orders</th>
                      <th className="text-right px-6 py-3 font-semibold text-gray-600">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[...salesData].reverse().map((row) => (
                      <tr key={row.date} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-700">
                          {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-3 text-center text-gray-700">{row.orderCount}</td>
                        <td className="px-6 py-3 text-right font-medium text-gray-900">{fmt(row.totalMinor)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t font-semibold">
                      <td className="px-6 py-3 text-gray-800">Total</td>
                      <td className="px-6 py-3 text-center text-gray-800">{totalOrders}</td>
                      <td className="px-6 py-3 text-right text-gray-900">{fmt(totalRevenue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Products Tab ── */}
      {tab === "products" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-base font-semibold text-gray-800">Top 10 Products by Units Sold</h2>
          </div>
          {productsLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : productData.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No product data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 w-12">Rank</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Product Name</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Units Sold</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {productData.map((p, i) => (
                    <tr key={p.productId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          i === 0 ? "bg-yellow-100 text-yellow-700" :
                          i === 1 ? "bg-gray-100 text-gray-600" :
                          i === 2 ? "bg-orange-100 text-orange-600" :
                          "bg-gray-50 text-gray-500"
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1">{p.productTitle}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-800">{p.unitsSold}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(p.revenueMinor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Customers Tab ── */}
      {tab === "customers" && (
        <>
          {customersLoading ? (
            <div className="p-8 text-center text-gray-400">Loading customer analytics...</div>
          ) : customerData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Total Customers"
                value={customerData.totalCustomers.toLocaleString("en-IN")}
              />
              <StatCard
                icon={Users}
                label="New This Month"
                value={customerData.newThisMonth.toLocaleString("en-IN")}
                sub="Registered this calendar month"
              />
              <StatCard
                icon={Users}
                label="Returning Customers"
                value={customerData.returningCount.toLocaleString("en-IN")}
                sub="Placed more than 1 order"
              />
              <StatCard
                icon={ShoppingBag}
                label="Orders This Month"
                value={customerData.ordersThisMonth.toLocaleString("en-IN")}
                sub="Current calendar month"
              />
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">No customer data available</div>
          )}

          {customerData && (
            <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Customer Composition</h2>
              <div className="space-y-3">
                {[
                  {
                    label: "New customers (this month)",
                    value: customerData.newThisMonth,
                    total: customerData.totalCustomers,
                    color: "bg-brand-500",
                  },
                  {
                    label: "Returning customers",
                    value: customerData.returningCount,
                    total: customerData.totalCustomers,
                    color: "bg-green-500",
                  },
                ].map(({ label, value, total, color }) => {
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{label}</span>
                        <span className="font-semibold text-gray-900">{value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`${color} h-2 rounded-full transition-all`}
                          style={{ width: `${Math.max(pct, 0)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
