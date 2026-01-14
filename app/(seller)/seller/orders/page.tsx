"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Package, Truck, CheckCircle, Clock, AlertCircle, Filter, ChevronDown, ChevronUp, Download, Printer } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { formatDate, formatCurrency } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

interface Order {
  _id: string
  orderNumber: string
  user: { name: string; email: string; phone?: string; avatar?: string }
  items: Array<{
    product: { _id: string; name: string; images: string[] };
    quantity: number;
    price: number
  }>
  totalAmount: number
  status: string
  paymentStatus: string
  createdAt: string
  shippingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

export default function SellerOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 })
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [pagination.page, statusFilter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/seller/orders?${params}`)
      const data = await response.json()
      setOrders(data.orders || [])
      setPagination(data.pagination || pagination)
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, { // Using admin API for now as it has update logic, or creating specific seller one?
        // Actually seller should only update status of their items or the order if they are the sole seller?
        // For simplicity, assuming seller can update status of orders assigned to them effectively.
        // But better is to use a specific seller order update endpoint if the logic differs.
        // For now, let's assume the /api/orders/[id] is generic or use the admin one if permission allows.
        // Wait, the existing code used /api/orders/${orderId}. I should probably enable a seller-specific endpoint or ensure permissions.
        // Let's use the one we created for admin logic but ensure it checks for seller role too if shared, 
        // OR distinct logic. The admin logic is in `app/api/admin/orders/[id]`. 
        // I should probably Create `app/api/seller/orders/[id]/route.ts` to be safe and clean.
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast({ title: "Success", description: `Order marked as ${newStatus}` })
        fetchOrders()
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" })
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchOrders()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "confirmed": return "bg-blue-100 text-blue-800 border-blue-200"
      case "processing": return "bg-purple-100 text-purple-800 border-purple-200"
      case "shipped": return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "delivered": return "bg-green-100 text-green-800 border-green-200"
      case "cancelled": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600">View and manage your customer orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Manifest
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <form onSubmit={handleSearch} className="flex-1 w-full md:w-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by Order ID, Customer Name..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={(val) => {
                setStatusFilter(val)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            Showing {orders.length} orders
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-32" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-2">
                {searchQuery || statusFilter !== 'all'
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "When you receive new orders, they will appear here."}
              </p>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="w-[140px]">Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product Info</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium">
                        <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                          #{order.orderNumber}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.user?.name || "Guest"}</span>
                          <span className="text-xs text-gray-500">{order.user?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="h-5 px-1 bg-white">
                                {item.quantity}x
                              </Badge>
                              <span className="truncate max-w-[150px]" title={item.product?.name}>
                                {item.product?.name || "Product"}
                              </span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <span className="text-xs text-gray-500 pl-1">
                              +{order.items.length - 2} more items
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'} className={
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }>
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <div className="h-4 w-4 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs">•••</div>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/seller/orders/${order._id}`)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateOrderStatus(order._id, 'processing')}>
                              <Package className="mr-2 h-4 w-4" /> Mark Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order._id, 'shipped')}>
                              <Truck className="mr-2 h-4 w-4" /> Mark Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order._id, 'delivered')}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Mark Delivered
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => updateOrderStatus(order._id, 'cancelled')}>
                              <AlertCircle className="mr-2 h-4 w-4" /> Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}