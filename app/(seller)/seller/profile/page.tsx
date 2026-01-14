"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"
import {
  User, Mail, Phone, MapPin, Calendar, Star, Package, ShoppingBag,
  Edit, Save, Building, CreditCard, FileText, CheckCircle, AlertCircle, XCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"

interface SellerProfile {
  name: string
  email: string
  phone: string
  avatar: string
  joinDate: string

  businessName: string
  businessType: string
  businessDescription: string
  businessAddress: {
    address: string
    city: string
    state: string
    pincode: string
    country: string
  }

  rating: number
  totalProducts: number
  totalSales: number
  totalRevenue: number

  status: string
  isVerified: boolean
  documents: { type: string, isVerified: boolean }[]
  bankDetails: {
    bankName: string
    accountNumber: string
    ifscCode: string
    accountHolderName: string
  }
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state for editing
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/seller/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        setFormData({
          name: data.profile.name,
          phone: data.profile.phone,
          businessName: data.profile.businessName,
          businessDescription: data.profile.businessDescription,
          businessAddress: { ...data.profile.businessAddress }
        })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load profile", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/seller/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setEditing(false)
        fetchProfile() // Refresh data
        toast({ title: "Success", description: "Profile updated successfully" })
      } else {
        throw new Error("Failed to update")
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleAddressChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      businessAddress: { ...prev.businessAddress, [field]: value }
    }))
  }

  if (loading || !profile) {
    return <div className="p-8 text-center text-gray-500">Loading profile...</div>
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seller Profile</h1>
          <p className="text-gray-600">Manage your business information and settings</p>
        </div>
        <div className="flex space-x-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={saveProfile} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Overview card */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-6">
            <div className="text-center">
              <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-white shadow-lg">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-2xl">{profile.name?.[0]}</AvatarFallback>
              </Avatar>

              <h2 className="text-xl font-bold text-gray-900">{profile.businessName}</h2>
              <p className="text-sm text-gray-500 mb-4">{profile.name}</p>

              <div className="flex flex-col gap-2 items-center justify-center mb-6">
                <Badge variant={profile.isVerified ? "default" : "secondary"} className={
                  profile.isVerified ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                }>
                  {profile.isVerified ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                  {profile.isVerified ? "Verified Seller" : "Verification Pending"}
                </Badge>
                <Badge variant="outline" className="capitalize">{profile.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{profile.rating || 0}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-center">
                    <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" /> Rating
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{profile.totalProducts || 0}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-center">
                    <Package className="h-3 w-3 mr-1" /> Products
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-8 pt-6 border-t">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{profile.phone || "No phone added"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Joined {formatDate(profile.joinDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Details & Edit Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="text-sm font-medium text-gray-500">Total Revenue</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(profile.totalRevenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="text-sm font-medium text-gray-500">Total Sales</div>
                <div className="text-2xl font-bold text-blue-600">{profile.totalSales}</div>
              </CardContent>
            </Card>
            <Card className="col-span-2 lg:col-span-1">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="text-sm font-medium text-gray-500">Business Type</div>
                <div className="text-lg font-semibold capitalize">{profile.businessType}</div>
              </CardContent>
            </Card>
          </div>

          {/* Business Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-gray-500" /> Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  {editing ? (
                    <Input
                      value={formData.businessName}
                      onChange={(e) => handleChange("businessName", e.target.value)}
                    />
                  ) : (
                    <div className="p-2 border rounded-md bg-gray-50 text-sm">{profile.businessName}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  {editing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                  ) : (
                    <div className="p-2 border rounded-md bg-gray-50 text-sm">{profile.phone}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                {editing ? (
                  <Textarea
                    value={formData.businessDescription}
                    onChange={(e) => handleChange("businessDescription", e.target.value)}
                    rows={3}
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-gray-50 text-sm min-h-[80px]">
                    {profile.businessDescription || "No description provided."}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                {editing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={formData.businessAddress?.address}
                      onChange={(e) => handleAddressChange("address", e.target.value)}
                      placeholder="Street Address"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        value={formData.businessAddress?.city}
                        onChange={(e) => handleAddressChange("city", e.target.value)}
                        placeholder="City"
                      />
                      <Input
                        value={formData.businessAddress?.state}
                        onChange={(e) => handleAddressChange("state", e.target.value)}
                        placeholder="State"
                      />
                      <Input
                        value={formData.businessAddress?.pincode}
                        onChange={(e) => handleAddressChange("pincode", e.target.value)}
                        placeholder="Pincode"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2 border rounded-md bg-gray-50 text-sm">
                    {profile.businessAddress?.address}<br />
                    {profile.businessAddress?.city}, {profile.businessAddress?.state} - {profile.businessAddress?.pincode}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bank & Documents (Read Only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-gray-500" /> Bank Details
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bank Name</span>
                  <span className="font-medium">{profile.bankDetails?.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Holder</span>
                  <span className="font-medium">{profile.bankDetails?.accountHolderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account No</span>
                  <span className="font-medium">•••• •••• {profile.bankDetails?.accountNumber?.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">IFSC Code</span>
                  <span className="font-medium">{profile.bankDetails?.ifscCode}</span>
                </div>
                <div className="pt-2 text-xs text-gray-400">
                  To change bank details, please contact support.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" /> Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                {profile.documents?.length > 0 ? profile.documents.map((doc: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="capitalize">{doc.type.replace('_', ' ')}</span>
                    {doc.isVerified ? (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Pending</Badge>
                    )}
                  </div>
                )) : (
                  <div className="text-gray-500 italic">No documents uploaded</div>
                )}
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Upload New Document
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}