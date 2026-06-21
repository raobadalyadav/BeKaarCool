"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import {
  Package, CreditCard, Wallet, MapPin, Settings, HelpCircle,
  Gift, Users, Shield, Bell, ChevronRight, ShoppingBag, Clock,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import * as ordersApi from "@/lib/api/orders"
import * as walletApi from "@/lib/api/wallet"
import { minorToRupees } from "@/lib/api/config"
import type { OrderDto } from "@/lib/api/types"

/* ── Status label map ───────────────────────────────────────────── */
const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Awaiting Payment",
  paid:            "Confirmed",
  packed:          "Processing",
  shipped:         "Shipped",
  delivered:       "Delivered",
  cancelled:       "Cancelled",
  return_pending:  "Return Requested",
  return_approved: "Return Approved",
  returned:        "Returned",
  refunded:        "Refunded",
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-50 text-yellow-700 border-yellow-200",
  paid:            "bg-blue-50 text-blue-700 border-blue-200",
  packed:          "bg-purple-50 text-purple-700 border-purple-200",
  shipped:         "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered:       "bg-green-50 text-green-700 border-green-200",
  cancelled:       "bg-red-50 text-red-700 border-red-200",
  return_pending:  "bg-orange-50 text-orange-700 border-orange-200",
  return_approved: "bg-teal-50 text-teal-700 border-teal-200",
  returned:        "bg-gray-50 text-gray-600 border-gray-200",
  refunded:        "bg-gray-50 text-gray-500 border-gray-200",
}

/* ── Quick action card ──────────────────────────────────────────── */
function ActionCard({ icon: Icon, title, description, href }: { icon: React.ElementType; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="bg-white p-5 rounded-xl border hover:shadow-md hover:border-[#F38508]/40 transition-all group block">
      <Icon className="w-7 h-7 text-[#F38508] mb-2.5 group-hover:scale-110 transition-transform" />
      <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </Link>
  )
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function AccountOverviewPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    Promise.allSettled([
      ordersApi.listOrders(5),
      walletApi.myWallet(1),
    ]).then(([ordersResult, walletResult]) => {
      if (ordersResult.status === "fulfilled") setOrders(ordersResult.value)
      if (walletResult.status === "fulfilled") setWalletBalance(minorToRupees(walletResult.value.balanceMinor))
      setLoading(false)
    })
  }, [session])

  const user = session?.user
  const activeOrders = orders.filter(o => !["delivered", "cancelled", "returned", "refunded"].includes(o.status))

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#F38508] to-[#D97706] rounded-2xl p-6 text-black">
        <h1 className="text-2xl font-black">
          Hello, {user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-sm mt-1 opacity-80">Welcome to your account dashboard</p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-6 mt-5">
          <div>
            <p className="text-xs font-medium opacity-70">Total Orders</p>
            {loading ? <Skeleton className="h-7 w-10 mt-1 bg-black/10" /> : (
              <p className="text-2xl font-black">{orders.length}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium opacity-70">Active Orders</p>
            {loading ? <Skeleton className="h-7 w-8 mt-1 bg-black/10" /> : (
              <p className="text-2xl font-black">{activeOrders.length}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium opacity-70">Wallet Balance</p>
            {loading ? <Skeleton className="h-7 w-20 mt-1 bg-black/10" /> : (
              <p className="text-2xl font-black">₹{(walletBalance ?? 0).toLocaleString("en-IN")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm text-[#F38508] hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-10 text-center">
              <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No orders yet</p>
              <Link href="/products" className="text-[#F38508] text-sm hover:underline mt-1 block">Start shopping →</Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map(order => {
              const firstItem = order.items[0]
              const date = new Date(order.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
              return (
                <Link key={order.id} href={`/account/orders`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0 border">
                        {firstItem?.productImage ? (
                          <Image src={firstItem.productImage} alt={firstItem.productTitleSnapshot} width={48} height={56} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-300" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {firstItem?.productTitleSnapshot ?? "Order"}
                          {order.items.length > 1 && <span className="text-gray-400 font-normal"> +{order.items.length - 1} more</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{date}</span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs font-bold text-gray-700">#{order.number}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-sm text-[#F38508]">₹{minorToRupees(order.totalMinor).toLocaleString("en-IN")}</p>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-[10px] ${STATUS_COLORS[order.status] ?? "bg-gray-50 text-gray-600"}`}
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ActionCard icon={Package}    title="My Orders"       description="Track & manage orders"      href="/account/orders" />
          <ActionCard icon={Wallet}     title="My Wallet"       description="Balance & gift cards"        href="/account/wallet" />
          <ActionCard icon={MapPin}     title="Addresses"       description="Manage delivery addresses"   href="/account/addresses" />
          <ActionCard icon={Gift}       title="My Rewards"      description="Points & cashback"           href="/account/rewards" />
          <ActionCard icon={Users}      title="Refer & Earn"    description="Share and get rewarded"      href="/account/referral" />
          <ActionCard icon={CreditCard} title="Payments"        description="Payment history"             href="/account/payments" />
          <ActionCard icon={Bell}       title="Notifications"   description="Manage alerts"               href="/account/notifications" />
          <ActionCard icon={Shield}     title="Security"        description="Password & sessions"         href="/account/security" />
          <ActionCard icon={Settings}   title="Profile"         description="Edit personal details"       href="/account/profile" />
          <ActionCard icon={HelpCircle} title="Help & Support"  description="Get help from us"            href="/account/support" />
        </div>
      </div>
    </div>
  )
}
