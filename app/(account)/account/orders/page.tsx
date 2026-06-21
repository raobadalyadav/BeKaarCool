"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package, Search, Download, X, AlertTriangle, RefreshCw, Truck,
  CheckCircle, XCircle, Clock, RotateCcw, Eye, ShoppingBag,
} from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import * as ordersApi from "@/lib/api/orders"
import { minorToRupees } from "@/lib/api/config"
import type { OrderDto } from "@/lib/api/types"

/* ── Status helpers ─────────────────────────────────────────────── */

const STATUS_META: Record<string, { label: string; icon: typeof Package; color: string }> = {
  pending_payment: { label: "Awaiting Payment", icon: Clock, color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  paid:            { label: "Confirmed",         icon: RefreshCw, color: "bg-blue-50 text-blue-700 border-blue-200" },
  packed:          { label: "Processing",        icon: Package, color: "bg-purple-50 text-purple-700 border-purple-200" },
  shipped:         { label: "Shipped",           icon: Truck, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  delivered:       { label: "Delivered",         icon: CheckCircle, color: "bg-green-50 text-green-700 border-green-200" },
  cancelled:       { label: "Cancelled",         icon: XCircle, color: "bg-red-50 text-red-700 border-red-200" },
  return_pending:  { label: "Return Requested",  icon: RotateCcw, color: "bg-orange-50 text-orange-700 border-orange-200" },
  return_approved: { label: "Return Approved",   icon: RotateCcw, color: "bg-teal-50 text-teal-700 border-teal-200" },
  returned:        { label: "Returned",          icon: RotateCcw, color: "bg-gray-50 text-gray-700 border-gray-200" },
  refunded:        { label: "Refunded",          icon: CheckCircle, color: "bg-gray-50 text-gray-600 border-gray-200" },
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, icon: Package, color: "bg-gray-50 text-gray-700 border-gray-200" }
  const Icon = meta.icon
  return (
    <Badge variant="outline" className={`${meta.color} gap-1.5 font-semibold text-xs`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </Badge>
  )
}

const ACTIVE_STATUSES = new Set(["pending_payment", "paid", "packed", "shipped", "return_pending", "return_approved"])
const CANCELLABLE_STATUSES = new Set(["pending_payment", "paid"])
const TERMINAL_STATUSES = new Set(["delivered", "cancelled", "returned", "refunded"])

/* ── Order Card ─────────────────────────────────────────────────── */

function OrderCard({ order, onRefresh }: { order: OrderDto; onRefresh: () => void }) {
  const { toast } = useToast()
  const [cancelReason, setCancelReason] = useState("")
  const [cancelling, setCancelling] = useState(false)

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast({ title: "Provide a cancellation reason", variant: "destructive" })
      return
    }
    setCancelling(true)
    try {
      await ordersApi.cancelOrder({ number: order.number, reason: cancelReason })
      toast({ title: "Order cancelled" })
      setCancelReason("")
      onRefresh()
    } catch (e) {
      toast({ title: "Cancel failed", description: e instanceof Error ? e.message : "Try again", variant: "destructive" })
    } finally {
      setCancelling(false)
    }
  }

  const total = minorToRupees(order.totalMinor)
  const date = new Date(order.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="bg-gray-50 px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-bold text-gray-900">#{order.number}</span>
          <span className="text-gray-400 hidden sm:inline">|</span>
          <span className="text-gray-500">{date}</span>
          {order.paymentMethod && (
            <>
              <span className="text-gray-400 hidden sm:inline">|</span>
              <span className="text-gray-500 capitalize">{order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</span>
            </>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="p-5">
        {/* Items */}
        <div className="space-y-3">
          {order.items.map((item) => {
            const opts = (() => { try { return JSON.parse(item.variantOptionsJson ?? "{}") } catch { return {} } })() as Record<string, string>
            return (
              <div key={item.id} className="flex gap-3">
                <div className="w-14 h-16 relative bg-gray-100 rounded overflow-hidden flex-shrink-0 border">
                  {item.productImage ? (
                    <Image src={item.productImage} alt={item.productTitleSnapshot} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{item.productTitleSnapshot}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {opts.size && <Badge variant="outline" className="text-[10px] h-4 px-1.5">Size: {opts.size}</Badge>}
                    {opts.color && <Badge variant="outline" className="text-[10px] h-4 px-1.5">{opts.color}</Badge>}
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Qty: {item.quantity}</Badge>
                  </div>
                  {item.productSlug && (
                    <Link href={`/products/${item.productSlug}`} className="text-[11px] text-[#F38508] hover:underline mt-1 block">
                      View product →
                    </Link>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-sm">₹{minorToRupees(item.totalMinor).toLocaleString("en-IN")}</p>
                  <p className="text-xs text-gray-400 mt-0.5">₹{minorToRupees(item.unitPriceMinor).toLocaleString()} × {item.quantity}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between mt-5 pt-4 border-t gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-400">Order Total</p>
              <p className="text-lg font-black text-[#F38508]">₹{total.toLocaleString("en-IN")}</p>
            </div>
            {order.couponCode && (
              <div>
                <p className="text-xs text-gray-400">Coupon</p>
                <p className="text-sm font-mono font-bold text-green-600">{order.couponCode}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={`/account/orders/${order.number}`}>
              <Button variant="outline" size="sm" className="text-xs">
                <Eye className="w-3.5 h-3.5 mr-1" /> Details
              </Button>
            </Link>
            <Button
              variant="outline" size="sm" className="text-xs"
              onClick={() => window.open(`/account/orders/${order.number}/invoice`, "_blank")}
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Invoice
            </Button>
            {CANCELLABLE_STATUSES.has(order.status) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs text-red-600 border-red-200 hover:bg-red-50">
                    <X className="w-3.5 h-3.5 mr-1" /> Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" /> Cancel Order #{order.number}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Your payment (if any) will be refunded within 5–7 business days.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Textarea
                    className="my-2"
                    placeholder="Reason for cancellation (required)…"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setCancelReason("")}>Keep Order</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={handleCancel}
                      disabled={cancelling || !cancelReason.trim()}
                    >
                      {cancelling ? "Cancelling…" : "Yes, Cancel"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ── Page ───────────────────────────────────────────────────────── */

export default function MyOrdersPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const list = await ordersApi.listOrders(50)
      setOrders(list)
    } catch (e) {
      toast({ title: "Error", description: "Could not load orders", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (session) fetchOrders()
  }, [session, fetchOrders])

  const filtered = orders
    .filter((o) => statusFilter === "all" || o.status === statusFilter)
    .filter((o) =>
      !search ||
      o.number.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.productTitleSnapshot.toLowerCase().includes(search.toLowerCase()))
    )

  const active    = filtered.filter((o) => ACTIVE_STATUSES.has(o.status))
  const completed = filtered.filter((o) => o.status === "delivered")
  const cancelled = filtered.filter((o) => TERMINAL_STATUSES.has(o.status) && o.status !== "delivered")

  const renderList = (list: OrderDto[], emptyMsg: string) => {
    if (loading) return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-28 w-full" /></CardContent></Card>
        ))}
      </div>
    )
    if (list.length === 0) return (
      <Card className="border-dashed border-2">
        <CardContent className="py-14 text-center">
          <ShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{emptyMsg}</p>
          <Link href="/products">
            <Button className="mt-4 bg-[#F38508] hover:bg-[#D97706] text-black font-bold" size="sm">
              Browse Products
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
    return (
      <div className="space-y-4">
        {list.map((o) => <OrderCard key={o.id} order={o} onRefresh={fetchOrders} />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orders.length} order{orders.length !== 1 ? "s" : ""} total</p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by order number or product…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending_payment">Awaiting Payment</SelectItem>
            <SelectItem value="paid">Confirmed</SelectItem>
            <SelectItem value="packed">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="return_pending">Return Requested</SelectItem>
            <SelectItem value="return_approved">Return Approved</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({completed.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({cancelled.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {renderList(filtered, "No orders found. Try adjusting your search or filters.")}
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          {renderList(active, "No active orders right now.")}
        </TabsContent>
        <TabsContent value="delivered" className="mt-4">
          {renderList(completed, "No delivered orders yet.")}
        </TabsContent>
        <TabsContent value="closed" className="mt-4">
          {renderList(cancelled, "No cancelled or returned orders.")}
        </TabsContent>
      </Tabs>
    </div>
  )
}
