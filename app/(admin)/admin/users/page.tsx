"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Download,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShieldCheck,
  ShieldX,
  UserCog,
  Ban,
  CheckCircle,
  Package,
  Home,
  Briefcase,
  Crown,
  Coins,
  ShoppingBag,
} from "lucide-react"
import { formatDate, getStatusColor } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface UserAddress {
  _id: string
  type: "home" | "work" | "other"
  name: string
  phone: string
  address: string
  landmark?: string
  city: string
  state: string
  pincode: string
  country: string
  isDefault: boolean
}

interface UserOrder {
  _id: string
  orderNumber: string
  status: string
  paymentStatus: string
  totalAmount: number
  createdAt: string
  items: Array<{ name: string; quantity: number }>
}

interface User {
  _id: string
  name: string
  email: string
  phone?: string
  role: string
  avatar?: string
  isVerified: boolean
  isActive: boolean
  isBanned: boolean
  banReason?: string
  bannedAt?: string
  lastLogin?: string
  createdAt: string
  loyaltyPoints?: number
  loyaltyTier?: string
  totalSpent?: number
  totalOrders?: number
  walletBalance?: number
}

interface UserStats {
  total: number
  active: number
  verified: number
  banned: number
  sellers: number
  admins: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userOrders, setUserOrders] = useState<UserOrder[]>([])
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([])
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [newRole, setNewRole] = useState("")
  const [banReason, setBanReason] = useState("")
  const [userDetailsLoading, setUserDetailsLoading] = useState(false)
  const [stats, setStats] = useState<UserStats>({ total: 0, active: 0, verified: 0, banned: 0, sellers: 0, admins: 0 })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, roleFilter, statusFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (roleFilter !== "all") params.append("role", roleFilter)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users || [])
        setPagination(data.pagination || pagination)
        if (data.stats) setStats(data.stats)
      } else {
        throw new Error(data.message || "Failed to fetch users")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUserDetails = async (userId: string) => {
    setUserDetailsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      const data = await response.json()

      if (response.ok) {
        setSelectedUser(data.user)
        setUserOrders(data.orders || [])
        setUserAddresses(data.addresses || [])
      } else {
        throw new Error(data.message || "Failed to fetch user details")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch user details",
        variant: "destructive",
      })
    } finally {
      setUserDetailsLoading(false)
    }
  }

  const updateUserRole = async () => {
    if (!selectedUser || !newRole) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        await fetchUsers()
        setShowRoleDialog(false)
        setNewRole("")
        toast({
          title: "Success",
          description: `User role updated to ${newRole}`,
        })
      } else {
        throw new Error("Failed to update user role")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      })
    }
  }

  const handleBanUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isBanned: true,
          banReason: banReason || "No reason provided"
        }),
      })

      if (response.ok) {
        await fetchUsers()
        setShowBanDialog(false)
        setBanReason("")
        toast({
          title: "User Banned",
          description: `${selectedUser.name} has been banned`,
        })
      } else {
        throw new Error("Failed to ban user")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to ban user",
        variant: "destructive",
      })
    }
  }

  const handleUnbanUser = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: false }),
      })

      if (response.ok) {
        await fetchUsers()
        toast({
          title: "User Unbanned",
          description: `${user.name} has been unbanned`,
        })
      } else {
        throw new Error("Failed to unban user")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unban user",
        variant: "destructive",
      })
    }
  }

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        await fetchUsers()
        toast({
          title: "Success",
          description: `User ${isActive ? "activated" : "deactivated"} successfully`,
        })
      } else {
        throw new Error("Failed to update user status")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      })
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchUsers()
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
      } else {
        throw new Error("Failed to delete user")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const exportUsers = async () => {
    try {
      const response = await fetch("/api/admin/users/export")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `users-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export users",
        variant: "destructive",
      })
    }
  }

  const openUserDetailsDialog = async (user: User) => {
    setSelectedUser(user)
    setShowUserDialog(true)
    await fetchUserDetails(user._id)
  }

  const openRoleDialog = (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setShowRoleDialog(true)
  }

  const openBanDialog = (user: User) => {
    setSelectedUser(user)
    setBanReason("")
    setShowBanDialog(true)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
      case "super_admin":
        return "bg-purple-100 text-purple-800"
      case "seller":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAddressIcon = (type: string) => {
    switch (type) {
      case "work":
        return <Briefcase className="h-4 w-4" />
      case "other":
        return <MapPin className="h-4 w-4" />
      default:
        return <Home className="h-4 w-4" />
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportUsers}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sellers</p>
                <p className="text-2xl font-bold">{stats.sellers}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold">{stats.verified}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Banned</p>
                <p className="text-2xl font-bold text-red-700">{stats.banned}</p>
              </div>
              <Ban className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchUsers}>
              <Filter className="mr-2 h-4 w-4" />
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No users found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user._id} className={user.isBanned ? "bg-red-50" : ""}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role === "super_admin" ? "Super Admin" : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {user.isBanned ? (
                          <Badge className="bg-red-100 text-red-800">
                            <Ban className="h-3 w-3 mr-1" />
                            Banned
                          </Badge>
                        ) : (
                          <Badge className={getStatusColor(user.isActive ? "active" : "inactive")}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        )}
                        {user.isVerified && <Badge variant="secondary">Verified</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>{user.lastLogin ? formatDate(user.lastLogin) : "Never"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openUserDetailsDialog(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateUserStatus(user._id, !user.isActive)}>
                            {user.isActive ? (
                              <>
                                <ShieldX className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          {user.isBanned ? (
                            <DropdownMenuItem onClick={() => handleUnbanUser(user)}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              <span className="text-green-600">Unban User</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => openBanDialog(user)}>
                              <Ban className="mr-2 h-4 w-4 text-red-600" />
                              <span className="text-red-600">Ban User</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteUser(user._id)} className="text-red-600">
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

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </Button>

          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
            const startPage = Math.max(1, pagination.page - 2)
            const page = startPage + i
            if (page > pagination.pages) return null
            return (
              <Button
                key={page}
                variant={pagination.page === page ? "default" : "outline"}
                onClick={() => setPagination((prev) => ({ ...prev, page }))}
              >
                {page}
              </Button>
            )
          })}

          <Button
            variant="outline"
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}

      {/* User Details Dialog with Tabs */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="addresses">Addresses</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl">{selectedUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getRoleColor(selectedUser.role)}>
                        {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                      </Badge>
                      {selectedUser.isBanned ? (
                        <Badge className="bg-red-100 text-red-800">
                          <Ban className="h-3 w-3 mr-1" />
                          Banned
                        </Badge>
                      ) : (
                        <Badge className={getStatusColor(selectedUser.isActive ? "active" : "inactive")}>
                          {selectedUser.isActive ? "Active" : "Inactive"}
                        </Badge>
                      )}
                      {selectedUser.isVerified && <Badge variant="secondary">Verified</Badge>}
                    </div>
                  </div>
                </div>

                {selectedUser.isBanned && selectedUser.banReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Ban Reason:</p>
                    <p className="text-sm text-red-700">{selectedUser.banReason}</p>
                    {selectedUser.bannedAt && (
                      <p className="text-xs text-red-500 mt-1">Banned on {formatDate(selectedUser.bannedAt)}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedUser.email}</span>
                    </div>
                    {selectedUser.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{selectedUser.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Joined {formatDate(selectedUser.createdAt)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Crown className="h-4 w-4 text-amber-500" />
                      <span className="text-sm capitalize">{selectedUser.loyaltyTier || "Bronze"} Tier</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">{selectedUser.loyaltyPoints || 0} Points</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{selectedUser.totalOrders || 0} Orders (₹{(selectedUser.totalSpent || 0).toLocaleString()})</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders">
                <ScrollArea className="h-[400px]">
                  {userDetailsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-4 border rounded animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : userOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No orders found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userOrders.map((order) => (
                        <div key={order._id} className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{order.orderNumber}</p>
                              <p className="text-sm text-gray-500">{order.items.length} items</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">₹{order.totalAmount?.toLocaleString()}</p>
                              <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                            <Badge className={getStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Addresses Tab */}
              <TabsContent value="addresses">
                <ScrollArea className="h-[400px]">
                  {userDetailsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="p-4 border rounded animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  ) : userAddresses.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No addresses found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userAddresses.map((address) => (
                        <div key={address._id} className="p-4 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-100 rounded">
                              {getAddressIcon(address.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{address.name}</p>
                                <Badge variant="outline" className="capitalize">{address.type}</Badge>
                                {address.isDefault && (
                                  <Badge className="bg-green-100 text-green-800">Default</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{address.phone}</p>
                              <p className="text-sm text-gray-600">
                                {address.address}
                                {address.landmark && `, ${address.landmark}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.city}, {address.state} - {address.pincode}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.name}. This will affect their permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateUserRole} disabled={!newRole || newRole === selectedUser?.role}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Are you sure you want to ban {selectedUser?.name}? They will not be able to access their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ban Reason</Label>
              <Textarea
                placeholder="Enter the reason for banning this user..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBanUser}>
              <Ban className="mr-2 h-4 w-4" />
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
