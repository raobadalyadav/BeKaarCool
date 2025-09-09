"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Truck, Search, Filter, Package, Clock, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShippingOrder {
  _id: string
  orderId: string
  trackingNumber: string
  carrier: string
  status: "pending" | "picked_up" | "in_transit" | "delivered" | "returned"
  customerName: string
  customerAddress: string
  customerPhone: string
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  shippingCost: number
  estimatedDelivery: string
  actualDelivery?: string
  createdAt: string
}

export default function AdminShippingPage() {
  const [shipments, setShipments] = useState<ShippingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [carrierFilter, setCarrierFilter] = useState("all")
  const [selectedShipment, setSelectedShipment] = useState<ShippingOrder | null>(null)
  const [stats, setStats] = useState({
    totalShipments: 0,
    pendingShipments: 0,
    inTransitShipments: 0,
    deliveredShipments: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchShipments()
    fetchStats()
  }, [])

  const fetchShipments = async () => {
    try {
      const response = await fetch("/api/admin/shipping")
      if (response.ok) {
        const data = await response.json()
        setShipments(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch shipments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/shipping/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch shipping stats:", error)
    }
  }

  const updateShipmentStatus = async (shipmentId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/shipping/${shipmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Shipment status updated successfully",
        })
        fetchShipments()
        fetchStats()
      } else {
        throw new Error("Failed to update shipment status")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update shipment status",
        variant: "destructive",
      })
    }
  }

  const generateLabel = async (shipmentId: string) => {
    try {
      const response = await fetch(`/api/admin/shipping/${shipmentId}/label`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `shipping-label-${shipmentId}.pdf`
      a.click()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate shipping label",
        variant: "destructive",
      })
    }
  }

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      shipment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter
    const matchesCarrier = carrierFilter === "all" || shipment.carrier === carrierFilter
    return matchesSearch && matchesStatus && matchesCarrier
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "in_transit":
        return "bg-blue-100 text-blue-800"
      case "picked_up":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "returned":
        return "bg-red-100 text-red-800"
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
        <h1 className="text-3xl font-bold">Shipping Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShipments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.pendingShipments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inTransitShipments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.deliveredShipments}</div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search shipments..."
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
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by carrier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                <SelectItem value="shiprocket">Shiprocket</SelectItem>
                <SelectItem value="delhivery">Delhivery</SelectItem>
                <SelectItem value="bluedart">BlueDart</SelectItem>
                <SelectItem value="dtdc">DTDC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Shipments ({filteredShipments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Tracking Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Est. Delivery</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.map((shipment) => (
                <TableRow key={shipment._id}>
                  <TableCell className="font-medium">{shipment.orderId}</TableCell>
                  <TableCell>{shipment.trackingNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{shipment.customerName}</div>
                      <div className="text-sm text-gray-500">{shipment.customerPhone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{shipment.carrier}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(shipment.status)}>{shipment.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>{shipment.weight}kg</TableCell>
                  <TableCell>₹{shipment.shippingCost}</TableCell>
                  <TableCell>{new Date(shipment.estimatedDelivery).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedShipment(shipment)}>
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Shipment Details</DialogTitle>
                          </DialogHeader>
                          {selectedShipment && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium">Order Information</h4>
                                  <p>Order ID: {selectedShipment.orderId}</p>
                                  <p>Tracking: {selectedShipment.trackingNumber}</p>
                                  <p>Carrier: {selectedShipment.carrier}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium">Customer Information</h4>
                                  <p>Name: {selectedShipment.customerName}</p>
                                  <p>Phone: {selectedShipment.customerPhone}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium">Shipping Address</h4>
                                <p>{selectedShipment.customerAddress}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium">Package Details</h4>
                                  <p>Weight: {selectedShipment.weight}kg</p>
                                  <p>
                                    Dimensions: {selectedShipment.dimensions.length} x{" "}
                                    {selectedShipment.dimensions.width} x {selectedShipment.dimensions.height} cm
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-medium">Delivery Information</h4>
                                  <p>
                                    Est. Delivery: {new Date(selectedShipment.estimatedDelivery).toLocaleDateString()}
                                  </p>
                                  {selectedShipment.actualDelivery && (
                                    <p>
                                      Actual Delivery: {new Date(selectedShipment.actualDelivery).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Select onValueChange={(value) => updateShipmentStatus(selectedShipment._id, value)}>
                                  <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Update Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="picked_up">Picked Up</SelectItem>
                                    <SelectItem value="in_transit">In Transit</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="returned">Returned</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button onClick={() => generateLabel(selectedShipment._id)}>Generate Label</Button>
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
