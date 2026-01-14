"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import {
  Store,
  Search,
  Filter,
  UserCheck,
  UserX,
  Eye,
  DollarSign,
  MoreHorizontal,
  RefreshCw,
  ChevronDown,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Trash2,
  Package,
  ShoppingCart,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  CreditCard,
  TrendingUp,
  Calendar,
  Star,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react"
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type SellerStatus = "pending" | "approved" | "rejected" | "suspended" | "deleted"
type BusinessType = "individual" | "proprietorship" | "partnership" | "pvt_ltd" | "llp" | "other"

interface StatusHistory {
  status: SellerStatus
  timestamp: string
  reason?: string
  by?: { _id: string; name: string }
}

interface BankDetails {
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  bankName: string
  branchName?: string
  upiId?: string
  isVerified: boolean
}

interface Document {
  _id: string
  type: string
  number?: string
  url?: string
  isVerified: boolean
  verifiedAt?: string
}

interface BusinessAddress {
  address: string
  landmark?: string
  city: string
  state: string
  pincode: string
  country: string
}

interface Seller {
  _id: string
  user: {
    _id: string
    name: string
    email: string
    phone?: string
    avatar?: string
    isActive: boolean
    createdAt: string
  }
  businessName: string
  businessType: BusinessType
  businessDescription?: string
  businessLogo?: string
  businessEmail?: string
  businessPhone?: string
  businessWebsite?: string
  businessAddress: BusinessAddress
  gstNumber?: string
  panNumber?: string
  documents: Document[]
  bankDetails?: BankDetails
  status: SellerStatus
  statusHistory: StatusHistory[]
  isVerified: boolean
  commissionRate: number
  paymentSchedule: string
  pendingPayout: number
  totalEarnings: number
  totalPayouts: number
  rating: number
  totalRatings: number
  totalProducts: number
  totalOrders: number
  ordersDelivered: number
  ordersCancelled: number
  revenue: number
  fulfillmentRate: number
  minimumPayout?: number
  returnRate: number
  approvedAt?: string
  approvedBy?: { _id: string; name: string }
  createdAt: string
  updatedAt: string
}

interface SellerProduct {
  _id: string
  name: string
  images: string[]
  price: number
  discountPrice?: number
  stock: number
  isActive: boolean
  sku?: string
  rating: number
  reviewCount: number
  createdAt: string
}

interface SellerOrder {
  _id: string
  orderNumber: string
  customer: { name: string; email: string }
  total: number
  sellerTotal: number
  status: string
  paymentStatus: string
  itemCount: number
  createdAt: string
}

interface Stats {
  totalSellers: number
  activeSellers: number
  pendingSellers: number
  suspendedSellers: number
  totalRevenue: number
  totalProducts: number
  pendingPayouts: number
  newSellersThisMonth: number
}

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "proprietorship", label: "Proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "pvt_ltd", label: "Private Limited" },
  { value: "llp", label: "LLP" },
  { value: "other", label: "Other" },
]

const STATUS_OPTIONS: { value: SellerStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
  { value: "suspended", label: "Suspended", color: "bg-gray-100 text-gray-800" },
]

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [businessTypeFilter, setBusinessTypeFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([])
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<SellerStatus>("pending")
  const [statusReason, setStatusReason] = useState("")
  const [updating, setUpdating] = useState(false)
  const [stats, setStats] = useState<Stats>({
    totalSellers: 0,
    activeSellers: 0,
    pendingSellers: 0,
    suspendedSellers: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingPayouts: 0,
    newSellersThisMonth: 0,
  })
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchSellers()
    fetchStats()
  }, [statusFilter, businessTypeFilter])

  const fetchSellers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (businessTypeFilter !== "all") params.append("businessType", businessTypeFilter)

      const response = await fetch(`/api/admin/sellers?${params}`)
      const data = await response.json()

      if (response.ok) {
        setSellers(data.sellers || [])
      } else {
        throw new Error(data.error || "Failed to fetch sellers")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch sellers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/sellers/stats")
      const data = await response.json()
      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const fetchSellerDetails = async (sellerId: string) => {
    try {
      const response = await fetch(`/api/admin/sellers/${sellerId}`)
      const data = await response.json()

      if (response.ok) {
        setSelectedSeller(data)
        setShowDetailsDialog(true)
        fetchSellerProducts(sellerId)
        fetchSellerOrders(sellerId)
      } else {
        throw new Error(data.error || "Failed to fetch seller details")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const fetchSellerProducts = async (sellerId: string) => {
    setLoadingProducts(true)
    try {
      const response = await fetch(`/api/admin/sellers/${sellerId}/products?limit=10`)
      const data = await response.json()
      if (response.ok) {
        setSellerProducts(data.products || [])
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const fetchSellerOrders = async (sellerId: string) => {
    setLoadingOrders(true)
    try {
      const response = await fetch(`/api/admin/sellers/${sellerId}/orders?limit=10`)
      const data = await response.json()
      if (response.ok) {
        setSellerOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedSeller) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/sellers/${selectedSeller._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          statusReason: statusReason || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || `Seller ${newStatus} successfully`,
        })
        setShowStatusDialog(false)
        setStatusReason("")
        fetchSellers()
        fetchStats()
        if (showDetailsDialog) {
          fetchSellerDetails(selectedSeller._id)
        }
      } else {
        throw new Error(data.error || "Failed to update status")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteSeller = async () => {
    if (!selectedSeller) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/sellers/${selectedSeller._id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Seller deleted successfully",
        })
        setShowDeleteDialog(false)
        setShowDetailsDialog(false)
        fetchSellers()
        fetchStats()
      } else {
        throw new Error(data.error || "Failed to delete seller")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const openStatusDialog = (seller: Seller, status?: SellerStatus) => {
    setSelectedSeller(seller)
    setNewStatus(status || seller.status)
    setStatusReason("")
    setShowStatusDialog(true)
  }

  const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status)
    return option?.color || "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      case "suspended":
        return <Ban className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const clearFilters = () => {
    setStatusFilter("all")
    setBusinessTypeFilter("all")
    setSearchTerm("")
  }

  const hasActiveFilters = statusFilter !== "all" || businessTypeFilter !== "all"

  const filteredSellers = sellers.filter((seller) => {
    const matchesSearch =
      seller.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.gstNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seller Management</h1>
          <p className="text-gray-600">Manage seller accounts, verification, and payouts</p>
        </div>
        <Button onClick={() => { fetchSellers(); fetchStats(); }} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Sellers</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalSellers}</p>
                <p className="text-xs text-blue-600 mt-1">+{stats.newSellersThisMonth} this month</p>
              </div>
              <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Store className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Sellers</p>
                <p className="text-3xl font-bold text-green-900">{stats.activeSellers}</p>
                <p className="text-xs text-green-600 mt-1">{stats.totalProducts} products listed</p>
              </div>
              <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.pendingSellers}</p>
                <p className="text-xs text-yellow-600 mt-1">Awaiting verification</p>
              </div>
              <div className="h-12 w-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Revenue</p>
                <p className="text-3xl font-bold text-purple-900">₹{(stats.totalRevenue / 100000).toFixed(1)}L</p>
                <p className="text-xs text-purple-600 mt-1">₹{stats.pendingPayouts?.toLocaleString()} pending</p>
              </div>
              <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
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
                    placeholder="Search by name, email, business name, GST..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Business Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {BUSINESS_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sellers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Sellers ({filteredSellers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredSellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No sellers found</p>
                    <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSellers.map((seller) => (
                  <TableRow key={seller._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={seller.businessLogo || seller.user?.avatar} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {seller.businessName?.charAt(0) || "S"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{seller.user?.name}</p>
                          <p className="text-sm text-gray-500">{seller.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{seller.businessName}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {seller.businessType?.replace(/_/g, " ")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{seller.totalProducts || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">₹{(seller.revenue || 0).toLocaleString()}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>{seller.rating?.toFixed(1) || "N/A"}</span>
                        <span className="text-gray-400 text-sm">({seller.totalRatings || 0})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(seller.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(seller.status)}
                          {seller.status?.charAt(0).toUpperCase() + seller.status?.slice(1)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{formatDate(seller.createdAt)}</p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => fetchSellerDetails(seller._id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {seller.status === "pending" && (
                            <>
                              <DropdownMenuItem onClick={() => openStatusDialog(seller, "approved")}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openStatusDialog(seller, "rejected")}>
                                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {seller.status === "approved" && (
                            <DropdownMenuItem onClick={() => openStatusDialog(seller, "suspended")}>
                              <Ban className="mr-2 h-4 w-4 text-orange-600" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {seller.status === "suspended" && (
                            <DropdownMenuItem onClick={() => openStatusDialog(seller, "approved")}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSeller(seller)
                              setShowDeleteDialog(true)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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

      {/* Seller Details Modal */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={selectedSeller?.businessLogo || selectedSeller?.user?.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                    {selectedSeller?.businessName?.charAt(0) || "S"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-xl">{selectedSeller?.businessName}</DialogTitle>
                  <DialogDescription className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedSeller?.status || "")}>
                      {getStatusIcon(selectedSeller?.status || "")}
                      <span className="ml-1">
                        {(selectedSeller?.status || "").charAt(0).toUpperCase() + (selectedSeller?.status || "").slice(1)}
                      </span>
                    </Badge>
                    {selectedSeller?.isVerified && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {selectedSeller && (
            <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="earnings">Earnings</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 mt-4 pr-4">
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Package className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                        <p className="text-2xl font-bold">{selectedSeller.totalProducts || 0}</p>
                        <p className="text-xs text-gray-500">Products</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <ShoppingCart className="h-6 w-6 mx-auto text-green-500 mb-2" />
                        <p className="text-2xl font-bold">{selectedSeller.totalOrders || 0}</p>
                        <p className="text-xs text-gray-500">Orders</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <DollarSign className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                        <p className="text-2xl font-bold">₹{((selectedSeller.revenue || 0) / 1000).toFixed(1)}K</p>
                        <p className="text-xs text-gray-500">Revenue</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Star className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                        <p className="text-2xl font-bold">{selectedSeller.rating?.toFixed(1) || "N/A"}</p>
                        <p className="text-xs text-gray-500">Rating</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Personal Info */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Owner Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-20">Name:</span>
                          <span className="font-medium">{selectedSeller.user?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{selectedSeller.user?.email}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(selectedSeller.user?.email || "", "email")}
                          >
                            {copiedField === "email" ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        {selectedSeller.user?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{selectedSeller.user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Joined {formatDate(selectedSeller.user?.createdAt || selectedSeller.createdAt)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Business Info */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Business Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-20">Type:</span>
                          <Badge variant="outline" className="capitalize">
                            {selectedSeller.businessType?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        {selectedSeller.gstNumber && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-20">GST:</span>
                            <span className="font-mono">{selectedSeller.gstNumber}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(selectedSeller.gstNumber || "", "gst")}
                            >
                              {copiedField === "gst" ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                        {selectedSeller.panNumber && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-20">PAN:</span>
                            <span className="font-mono">{selectedSeller.panNumber}</span>
                          </div>
                        )}
                        {selectedSeller.businessWebsite && (
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                            <a
                              href={selectedSeller.businessWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {selectedSeller.businessWebsite}
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Address */}
                  {selectedSeller.businessAddress && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Business Address
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p>{selectedSeller.businessAddress.address}</p>
                        {selectedSeller.businessAddress.landmark && (
                          <p className="text-gray-500">Landmark: {selectedSeller.businessAddress.landmark}</p>
                        )}
                        <p>
                          {selectedSeller.businessAddress.city}, {selectedSeller.businessAddress.state} -{" "}
                          {selectedSeller.businessAddress.pincode}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Status History */}
                  {selectedSeller.statusHistory && selectedSeller.statusHistory.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Status History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[...selectedSeller.statusHistory].reverse().slice(0, 5).map((entry, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className={`mt-1 w-2 h-2 rounded-full ${index === 0 ? "bg-blue-500" : "bg-gray-300"}`} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(entry.status)} variant="outline">
                                    {entry.status}
                                  </Badge>
                                  <span className="text-xs text-gray-500">{formatDateTime(entry.timestamp)}</span>
                                </div>
                                {entry.reason && <p className="text-sm text-gray-600 mt-1">{entry.reason}</p>}
                                {entry.by?.name && <p className="text-xs text-gray-400">by {entry.by.name}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Products Tab */}
                <TabsContent value="products" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Recent Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingProducts ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                              <div className="w-16 h-16 bg-gray-200 rounded"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : sellerProducts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No products found</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sellerProducts.map((product) => (
                            <div key={product._id} className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50">
                              <img
                                src={product.images?.[0] || "/placeholder.svg"}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium line-clamp-1">{product.name}</p>
                                    {product.sku && <p className="text-xs text-gray-500">SKU: {product.sku}</p>}
                                  </div>
                                  <Badge variant={product.isActive ? "default" : "secondary"}>
                                    {product.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span className="font-medium">₹{product.price?.toLocaleString()}</span>
                                  <span className="text-gray-500">Stock: {product.stock}</span>
                                  <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                    {product.rating?.toFixed(1) || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingOrders ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                          ))}
                        </div>
                      ) : sellerOrders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No orders found</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sellerOrders.map((order) => (
                            <div key={order._id} className="p-3 border rounded-lg hover:bg-gray-50">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{order.orderNumber}</p>
                                  <p className="text-sm text-gray-500">{order.customer?.name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">₹{order.sellerTotal?.toLocaleString()}</p>
                                  <p className="text-xs text-gray-500">{order.itemCount} items</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className="capitalize" variant="outline">
                                  {order.status}
                                </Badge>
                                <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Earnings Tab */}
                <TabsContent value="earnings" className="mt-0 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Total Earnings</p>
                        <p className="text-2xl font-bold text-green-600">
                          ₹{(selectedSeller.totalEarnings || 0).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Pending Payout</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          ₹{(selectedSeller.pendingPayout || 0).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Total Paid Out</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ₹{(selectedSeller.totalPayouts || 0).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Commission Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Commission Rate</span>
                        <span className="font-medium">{selectedSeller.commissionRate || 10}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment Schedule</span>
                        <span className="font-medium capitalize">{selectedSeller.paymentSchedule || "Monthly"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Minimum Payout</span>
                        <span className="font-medium">₹{selectedSeller.minimumPayout || 500}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bank Details */}
                  {selectedSeller.bankDetails && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Bank Details
                          {selectedSeller.bankDetails.isVerified && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Account Holder</span>
                          <span>{selectedSeller.bankDetails.accountHolderName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Account Number</span>
                          <span className="font-mono">
                            ****{selectedSeller.bankDetails.accountNumber?.slice(-4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">IFSC Code</span>
                          <span className="font-mono">{selectedSeller.bankDetails.ifscCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Bank</span>
                          <span>{selectedSeller.bankDetails.bankName}</span>
                        </div>
                        {selectedSeller.bankDetails.upiId && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">UPI ID</span>
                            <span>{selectedSeller.bankDetails.upiId}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Verification Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedSeller.documents && selectedSeller.documents.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {selectedSeller.documents.map((doc) => (
                            <div key={doc._id} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium capitalize">{doc.type.replace(/_/g, " ")}</span>
                                <Badge variant={doc.isVerified ? "default" : "secondary"}>
                                  {doc.isVerified ? "Verified" : "Pending"}
                                </Badge>
                              </div>
                              {doc.number && (
                                <p className="text-sm text-gray-600 font-mono">{doc.number}</p>
                              )}
                              {doc.url && (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 text-sm hover:underline flex items-center gap-1 mt-2"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View Document
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No documents uploaded</p>
                        </div>
                      )}

                      {/* GST & PAN as quick info */}
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">GST Number</p>
                          <p className="font-mono font-medium">{selectedSeller.gstNumber || "Not provided"}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">PAN Number</p>
                          <p className="font-mono font-medium">{selectedSeller.panNumber || "Not provided"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            {selectedSeller && selectedSeller.status !== "deleted" && (
              <>
                {selectedSeller.status === "pending" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => openStatusDialog(selectedSeller, "rejected")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => openStatusDialog(selectedSeller, "approved")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </>
                )}
                {selectedSeller.status === "approved" && (
                  <Button
                    variant="outline"
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                    onClick={() => openStatusDialog(selectedSeller, "suspended")}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend
                  </Button>
                )}
                {selectedSeller.status === "suspended" && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => openStatusDialog(selectedSeller, "approved")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Reactivate
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Seller Status</DialogTitle>
            <DialogDescription>
              Change the status of {selectedSeller?.businessName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <Badge className={getStatusColor(selectedSeller?.status || "")}>
                {getStatusIcon(selectedSeller?.status || "")}
                <span className="ml-1 capitalize">{selectedSeller?.status}</span>
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as SellerStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="flex items-center gap-2">
                        {getStatusIcon(s.value)}
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea
                placeholder="Add a reason for this status change..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={updating}>
              {updating ? (
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Seller
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedSeller?.businessName}</strong>? This action will:
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Deactivate the seller account</li>
                <li>Remove all their products from the marketplace</li>
                <li>This action cannot be undone</li>
              </ul>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSeller} disabled={updating}>
              {updating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Seller
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
