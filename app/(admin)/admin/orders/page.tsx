"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ShoppingCart,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  X,
  AlertCircle,
  Wallet,
  Banknote,
} from "lucide-react"
import { formatDate, formatDateTime, getStatusColor, formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "returned"
type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded"
type PaymentMethod = "razorpay" | "phonepe" | "paytm" | "payu" | "stripe" | "cod" | "upi" | "card" | "netbanking" | "wallet"

interface StatusHistoryItem {
  status: OrderStatus
  timestamp: string
  note?: string
  by?: {
    _id: string
    name: string
  }
}

interface OrderItem {
  _id: string
  product?: {
    _id: string
    name: string
    images: string[]
  }
  customProduct?: {
    name: string
    type: string
    basePrice: number
    design?: string
  }
  name: string
  image: string
  quantity: number
  price: number
  originalPrice?: number
  size?: string
  color?: string
  sku?: string
  customization?: {
    design?: string
    text?: string
    position?: { x: number; y: number }
    font?: string
    textColor?: string
    preview?: string
  }
  status: string
}

interface ShippingAddress {
  name: string
  phone: string
  alternatePhone?: string
  address: string
  landmark?: string
  city: string
  state: string
  pincode: string
  country: string
  type?: "home" | "work" | "other"
}

interface Order {
  _id: string
  orderNumber: string
  customer: {
    _id: string
    name: string
    email: string
    phone?: string
  }
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  discount: number
  couponCode?: string
  couponDiscount: number
  total: number
  status: OrderStatus
  statusHistory: StatusHistoryItem[]
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  paymentId?: string
  paymentDetails?: {
    provider: string
    transactionId?: string
    method?: string
    last4?: string
    bank?: string
    vpa?: string
  }
  shippingAddress: ShippingAddress
  billingAddress?: ShippingAddress
  billingIsSameAsShipping: boolean
  shipment?: {
    provider?: string
    awbNumber?: string
    trackingUrl?: string
  }
  estimatedDelivery?: string
  deliveredAt?: string
  cancelledAt?: string
  cancellationReason?: string
  cancelledBy?: "customer" | "seller" | "admin" | "system"
  notes?: string
  internalNotes?: string
  isGift: boolean
  giftMessage?: string
  source: "web" | "mobile" | "admin"
  refundDetails?: {
    amount: number
    reason: string
    processedAt?: string
    refundId?: string
  }
  createdAt: string
  updatedAt: string
}

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
]

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "razorpay", label: "Razorpay" },
  { value: "phonepe", label: "PhonePe" },
  { value: "paytm", label: "Paytm" },
  { value: "payu", label: "PayU" },
  { value: "stripe", label: "Stripe" },
  { value: "cod", label: "Cash on Delivery" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "netbanking", label: "Net Banking" },
  { value: "wallet", label: "Wallet" },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending")
  const [statusNote, setStatusNote] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, paymentFilter, paymentMethodFilter, startDate, endDate])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (paymentFilter !== "all") params.append("paymentStatus", paymentFilter)
      if (paymentMethodFilter !== "all") params.append("paymentMethod", paymentMethodFilter)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await fetch(`/api/admin/orders?${params}`)
      const data = await response.json()

      if (response.ok) {
        setOrders(Array.isArray(data) ? data : data.orders || [])
      } else {
        throw new Error(data.message || "Failed to fetch orders")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`)
      const data = await response.json()

      if (response.ok) {
        setSelectedOrder(data)
        setShowDetailsDialog(true)
      } else {
        throw new Error(data.message || "Failed to fetch order details")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch order details",
        variant: "destructive",
      })
    }
  }

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return

    setUpdatingStatus(true)
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          statusNote: statusNote || undefined,
        }),
      })

      if (response.ok) {
        const updatedOrder = await response.json()
        setSelectedOrder(updatedOrder)
        await fetchOrders()
        setShowStatusDialog(false)
        setStatusNote("")
        toast({
          title: "Success",
          description: "Order status updated successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to update order status")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const openStatusDialog = (order: Order) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setStatusNote("")
    setShowStatusDialog(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "shipped":
      case "out_for_delivery":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
      case "returned":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cod":
        return <Banknote className="h-4 w-4" />
      case "upi":
      case "wallet":
        return <Wallet className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const clearFilters = () => {
    setStatusFilter("all")
    setPaymentFilter("all")
    setPaymentMethodFilter("all")
    setStartDate("")
    setEndDate("")
    setSearchQuery("")
  }

  const hasActiveFilters = statusFilter !== "all" || paymentFilter !== "all" || paymentMethodFilter !== "all" || startDate || endDate

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => o.status === "pending").length
  const shippedOrders = orders.filter((o) => o.status === "shipped" || o.status === "out_for_delivery").length
  const totalRevenue = orders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + (o.total || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders and fulfillment</p>
        </div>
        <Button onClick={fetchOrders} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold">{pendingOrders}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold">{shippedOrders}</p>
              </div>
              <Truck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">₹{totalRevenue?.toLocaleString() ?? "0"}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by order number, customer name or email..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Order Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={showFilters ? "secondary" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                More Filters
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="flex flex-col md:flex-row gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Label className="whitespace-nowrap">Date Range:</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40"
                  />
                  <span>to</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No orders found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500 capitalize">{order.source}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer?.name}</p>
                        <p className="text-sm text-gray-500">{order.customer?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.items?.length || 0} items</p>
                        <p className="text-sm text-gray-500 truncate max-w-[150px]">
                          {order.items
                            ?.slice(0, 2)
                            .map((item) => item.name || item.product?.name)
                            .join(", ")}
                          {order.items?.length > 2 && "..."}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">₹{order.total?.toLocaleString() ?? "0"}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <Badge className={getStatusColor(order.status)}>
                          {order.status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={getStatusColor(order.paymentStatus)}>
                          {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          {getPaymentMethodIcon(order.paymentMethod)}
                          {PAYMENT_METHODS.find((m) => m.value === order.paymentMethod)?.label || order.paymentMethod}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{formatDate(order.createdAt)}</p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => fetchOrderDetails(order._id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openStatusDialog(order)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Update Status
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Order Details - {selectedOrder?.orderNumber}</span>
              {selectedOrder && (
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedOrder.status)}
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Badge>
                </div>
              )}
            </DialogTitle>
            <DialogDescription>
              Created on {selectedOrder && formatDateTime(selectedOrder.createdAt)} via {selectedOrder?.source}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="items">Items ({selectedOrder.items?.length || 0})</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="payment">Payment</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 mt-4">
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Customer Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="font-medium">{selectedOrder.customer?.name}</p>
                          <p className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-3 w-3" />
                            {selectedOrder.customer?.email}
                          </p>
                          {selectedOrder.customer?.phone && (
                            <p className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-3 w-3" />
                              {selectedOrder.customer.phone}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Shipping Address
                        </h4>
                        <div className="text-sm space-y-1">
                          <p className="font-medium">{selectedOrder.shippingAddress?.name}</p>
                          <p className="text-gray-600">{selectedOrder.shippingAddress?.phone}</p>
                          <p className="text-gray-600">{selectedOrder.shippingAddress?.address}</p>
                          {selectedOrder.shippingAddress?.landmark && (
                            <p className="text-gray-500">Landmark: {selectedOrder.shippingAddress.landmark}</p>
                          )}
                          <p className="text-gray-600">
                            {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{" "}
                            {selectedOrder.shippingAddress?.pincode}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Order Summary */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Order Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal</span>
                          <span>₹{selectedOrder.subtotal?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping</span>
                          <span>₹{selectedOrder.shipping?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax</span>
                          <span>₹{selectedOrder.tax?.toLocaleString()}</span>
                        </div>
                        {selectedOrder.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-₹{selectedOrder.discount?.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedOrder.couponCode && (
                          <div className="flex justify-between text-green-600">
                            <span>Coupon ({selectedOrder.couponCode})</span>
                            <span>-₹{selectedOrder.couponDiscount?.toLocaleString()}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span>₹{selectedOrder.total?.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shipment Info */}
                  {selectedOrder.shipment?.awbNumber && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Shipment Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-gray-600">Provider:</span> {selectedOrder.shipment.provider}
                          </p>
                          <p>
                            <span className="text-gray-600">AWB Number:</span> {selectedOrder.shipment.awbNumber}
                          </p>
                          {selectedOrder.shipment.trackingUrl && (
                            <a
                              href={selectedOrder.shipment.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Track Shipment →
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Notes */}
                  {(selectedOrder.notes || selectedOrder.internalNotes || selectedOrder.isGift) && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3">Notes</h4>
                        <div className="space-y-3 text-sm">
                          {selectedOrder.isGift && selectedOrder.giftMessage && (
                            <div>
                              <p className="text-gray-600 font-medium">Gift Message:</p>
                              <p className="bg-pink-50 p-2 rounded">{selectedOrder.giftMessage}</p>
                            </div>
                          )}
                          {selectedOrder.notes && (
                            <div>
                              <p className="text-gray-600 font-medium">Customer Notes:</p>
                              <p>{selectedOrder.notes}</p>
                            </div>
                          )}
                          {selectedOrder.internalNotes && (
                            <div>
                              <p className="text-gray-600 font-medium">Internal Notes:</p>
                              <p className="bg-yellow-50 p-2 rounded">{selectedOrder.internalNotes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Items Tab */}
                <TabsContent value="items" className="mt-0 space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <Card key={item._id || index}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={item.image || item.product?.images?.[0] || "/placeholder.svg"}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{item.name || item.product?.name}</p>
                                {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                              </div>
                              <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-3 text-sm">
                              {item.size && (
                                <span className="bg-gray-100 px-2 py-1 rounded">Size: {item.size}</span>
                              )}
                              {item.color && (
                                <span className="bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                  Color:{" "}
                                  <span
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: item.color }}
                                  ></span>
                                  {item.color}
                                </span>
                              )}
                              <span className="bg-gray-100 px-2 py-1 rounded">Qty: {item.quantity}</span>
                            </div>
                            <div className="mt-2 flex justify-between items-center">
                              <div>
                                {item.originalPrice && item.originalPrice > item.price && (
                                  <span className="text-gray-400 line-through mr-2">
                                    ₹{item.originalPrice?.toLocaleString()}
                                  </span>
                                )}
                                <span className="font-medium">₹{item.price?.toLocaleString()}</span>
                                <span className="text-gray-500"> × {item.quantity}</span>
                              </div>
                              <span className="font-semibold">
                                ₹{(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                            {item.customization && (
                              <div className="mt-3 border-t pt-3">
                                <p className="text-xs font-medium text-gray-600 mb-2">Customization:</p>
                                <div className="flex gap-4">
                                  {item.customization.preview && (
                                    <img
                                      src={item.customization.preview}
                                      alt="Customization preview"
                                      className="w-16 h-16 rounded border"
                                    />
                                  )}
                                  <div className="text-xs space-y-1">
                                    {item.customization.text && <p>Text: {item.customization.text}</p>}
                                    {item.customization.font && <p>Font: {item.customization.font}</p>}
                                    {item.customization.textColor && (
                                      <p className="flex items-center gap-1">
                                        Color:{" "}
                                        <span
                                          className="w-3 h-3 rounded border"
                                          style={{ backgroundColor: item.customization.textColor }}
                                        ></span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline" className="mt-0">
                  <Card>
                    <CardContent className="p-4">
                      <div className="relative">
                        {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 ? (
                          <div className="space-y-0">
                            {[...selectedOrder.statusHistory].reverse().map((entry, index) => (
                              <div key={index} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${index === 0
                                      ? "bg-blue-100 text-blue-600"
                                      : "bg-gray-100 text-gray-500"
                                      }`}
                                  >
                                    {getStatusIcon(entry.status)}
                                  </div>
                                  {index < selectedOrder.statusHistory.length - 1 && (
                                    <div className="w-0.5 h-full min-h-[40px] bg-gray-200"></div>
                                  )}
                                </div>
                                <div className="pb-6 flex-1">
                                  <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(entry.status)}>
                                      {entry.status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                    </Badge>
                                    <span className="text-sm text-gray-500">
                                      {formatDateTime(entry.timestamp)}
                                    </span>
                                  </div>
                                  {entry.note && (
                                    <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
                                  )}
                                  {entry.by?.name && (
                                    <p className="text-xs text-gray-400 mt-1">by {entry.by.name}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            <p>No status history available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Payment Tab */}
                <TabsContent value="payment" className="mt-0 space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Information
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Payment Status</span>
                          <Badge className={getStatusColor(selectedOrder.paymentStatus)}>
                            {selectedOrder.paymentStatus?.charAt(0).toUpperCase() +
                              selectedOrder.paymentStatus?.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Method</span>
                          <span className="flex items-center gap-2">
                            {getPaymentMethodIcon(selectedOrder.paymentMethod)}
                            {PAYMENT_METHODS.find((m) => m.value === selectedOrder.paymentMethod)?.label ||
                              selectedOrder.paymentMethod}
                          </span>
                        </div>
                        {selectedOrder.paymentId && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment ID</span>
                            <span className="font-mono text-xs">{selectedOrder.paymentId}</span>
                          </div>
                        )}
                        {selectedOrder.paymentDetails && (
                          <>
                            {selectedOrder.paymentDetails.transactionId && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Transaction ID</span>
                                <span className="font-mono text-xs">
                                  {selectedOrder.paymentDetails.transactionId}
                                </span>
                              </div>
                            )}
                            {selectedOrder.paymentDetails.bank && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Bank</span>
                                <span>{selectedOrder.paymentDetails.bank}</span>
                              </div>
                            )}
                            {selectedOrder.paymentDetails.vpa && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">UPI ID</span>
                                <span>{selectedOrder.paymentDetails.vpa}</span>
                              </div>
                            )}
                            {selectedOrder.paymentDetails.last4 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Card</span>
                                <span>**** **** **** {selectedOrder.paymentDetails.last4}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">Amount Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal</span>
                          <span>₹{selectedOrder.subtotal?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping</span>
                          <span>₹{selectedOrder.shipping?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax</span>
                          <span>₹{selectedOrder.tax?.toLocaleString()}</span>
                        </div>
                        {selectedOrder.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-₹{selectedOrder.discount?.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedOrder.couponCode && (
                          <div className="flex justify-between text-green-600">
                            <span>Coupon ({selectedOrder.couponCode})</span>
                            <span>-₹{selectedOrder.couponDiscount?.toLocaleString()}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total Paid</span>
                          <span>₹{selectedOrder.total?.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Refund Details */}
                  {selectedOrder.refundDetails && (
                    <Card className="border-red-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3 text-red-600">Refund Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Refund Amount</span>
                            <span className="text-red-600">
                              ₹{selectedOrder.refundDetails.amount?.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Reason</span>
                            <span>{selectedOrder.refundDetails.reason}</span>
                          </div>
                          {selectedOrder.refundDetails.processedAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Processed At</span>
                              <span>{formatDateTime(selectedOrder.refundDetails.processedAt)}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            {selectedOrder && (
              <Button onClick={() => openStatusDialog(selectedOrder)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Status
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status of order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <div className="flex items-center gap-2">
                {selectedOrder && getStatusIcon(selectedOrder.status)}
                <Badge className={getStatusColor(selectedOrder?.status || "")}>
                  {selectedOrder?.status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(s.value)}
                        {s.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Textarea
                placeholder="Add a note about this status change..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOrderStatus} disabled={updatingStatus}>
              {updatingStatus ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Update Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
