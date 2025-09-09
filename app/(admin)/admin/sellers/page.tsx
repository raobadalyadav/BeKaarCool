"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Store, Search, Filter, UserCheck, UserX, Eye, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Seller {
  _id: string
  name: string
  email: string
  phone: string
  businessName: string
  businessType: string
  status: "pending" | "approved" | "rejected" | "suspended"
  totalProducts: number
  totalSales: number
  revenue: number
  joinedAt: string
  documents: {
    gst?: string
    pan?: string
    businessLicense?: string
  }
}

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [stats, setStats] = useState({
    totalSellers: 0,
    activeSellers: 0,
    pendingSellers: 0,
    totalRevenue: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchSellers()
    fetchStats()
  }, [])

  const fetchSellers = async () => {
    try {
      const response = await fetch("/api/admin/sellers")
      if (response.ok) {
        const data = await response.json()
        setSellers(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sellers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/sellers/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch seller stats:", error)
    }
  }

  const updateSellerStatus = async (sellerId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/sellers/${sellerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Seller ${status} successfully`,
        })
        fetchSellers()
        fetchStats()
      } else {
        throw new Error("Failed to update seller status")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update seller status",
        variant: "destructive",
      })
    }
  }

  const filteredSellers = sellers.filter((seller) => {
    const matchesSearch =
      seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.businessName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || seller.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "suspended":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Seller Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sellers</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSellers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sellers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeSellers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <UserX className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingSellers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search sellers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sellers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Store className="h-5 w-5 mr-2" />
            Sellers ({filteredSellers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller Info</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSellers.map((seller) => (
                <TableRow key={seller._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{seller.name}</div>
                      <div className="text-sm text-gray-500">{seller.email}</div>
                      <div className="text-sm text-gray-500">{seller.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{seller.businessName}</div>
                      <div className="text-sm text-gray-500">{seller.businessType}</div>
                    </div>
                  </TableCell>
                  <TableCell>{seller.totalProducts}</TableCell>
                  <TableCell>₹{seller.revenue.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(seller.status)}>{seller.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(seller.joinedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedSeller(seller)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Seller Details</DialogTitle>
                          </DialogHeader>
                          {selectedSeller && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium">Personal Information</h4>
                                  <p>Name: {selectedSeller.name}</p>
                                  <p>Email: {selectedSeller.email}</p>
                                  <p>Phone: {selectedSeller.phone}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium">Business Information</h4>
                                  <p>Business Name: {selectedSeller.businessName}</p>
                                  <p>Business Type: {selectedSeller.businessType}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium">Documents</h4>
                                <div className="space-y-2">
                                  {selectedSeller.documents.gst && <p>GST: {selectedSeller.documents.gst}</p>}
                                  {selectedSeller.documents.pan && <p>PAN: {selectedSeller.documents.pan}</p>}
                                  {selectedSeller.documents.businessLicense && (
                                    <p>Business License: {selectedSeller.documents.businessLicense}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                {selectedSeller.status === "pending" && (
                                  <>
                                    <Button
                                      onClick={() => updateSellerStatus(selectedSeller._id, "approved")}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      onClick={() => updateSellerStatus(selectedSeller._id, "rejected")}
                                      variant="destructive"
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {selectedSeller.status === "approved" && (
                                  <Button
                                    onClick={() => updateSellerStatus(selectedSeller._id, "suspended")}
                                    variant="destructive"
                                  >
                                    Suspend
                                  </Button>
                                )}
                                {selectedSeller.status === "suspended" && (
                                  <Button
                                    onClick={() => updateSellerStatus(selectedSeller._id, "approved")}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Reactivate
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
