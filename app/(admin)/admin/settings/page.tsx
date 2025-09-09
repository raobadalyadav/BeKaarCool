"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Mail, Shield, Globe, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SiteSettings {
  general: {
    siteName: string
    siteDescription: string
    siteUrl: string
    logo: string
    favicon: string
    contactEmail: string
    supportEmail: string
    phone: string
    address: string
  }
  email: {
    smtpHost: string
    smtpPort: string
    smtpUser: string
    smtpPass: string
    fromEmail: string
    fromName: string
  }
  payment: {
    razorpayKeyId: string
    razorpayKeySecret: string
    paypalClientId: string
    paypalClientSecret: string
    stripePublishableKey: string
    stripeSecretKey: string
  }
  shipping: {
    shiprocketEmail: string
    shiprocketPassword: string
    freeShippingThreshold: number
    defaultShippingCost: number
  }
  features: {
    enableRegistration: boolean
    enableGuestCheckout: boolean
    enableReviews: boolean
    enableWishlist: boolean
    enableCoupons: boolean
    enableInventoryTracking: boolean
  }
  seo: {
    metaTitle: string
    metaDescription: string
    metaKeywords: string
    googleAnalyticsId: string
    facebookPixelId: string
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings saved successfully",
        })
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (section: keyof SiteSettings, field: string, value: any) => {
    if (!settings) return
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading settings...</div>
  }

  if (!settings) {
    return <div className="flex items-center justify-center h-64">Failed to load settings</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) => updateSettings("general", "siteName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.general.siteUrl}
                    onChange={(e) => updateSettings("general", "siteUrl", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.general.siteDescription}
                  onChange={(e) => updateSettings("general", "siteDescription", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.general.contactEmail}
                    onChange={(e) => updateSettings("general", "contactEmail", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) => updateSettings("general", "supportEmail", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.general.phone}
                    onChange={(e) => updateSettings("general", "phone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={settings.general.address}
                    onChange={(e) => updateSettings("general", "address", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Email Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={settings.email.smtpHost}
                    onChange={(e) => updateSettings("email", "smtpHost", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={settings.email.smtpPort}
                    onChange={(e) => updateSettings("email", "smtpPort", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={settings.email.smtpUser}
                    onChange={(e) => updateSettings("email", "smtpUser", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPass">SMTP Password</Label>
                  <Input
                    id="smtpPass"
                    type="password"
                    value={settings.email.smtpPass}
                    onChange={(e) => updateSettings("email", "smtpPass", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={settings.email.fromEmail}
                    onChange={(e) => updateSettings("email", "fromEmail", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={settings.email.fromName}
                    onChange={(e) => updateSettings("email", "fromName", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Razorpay</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="razorpayKeyId">Key ID</Label>
                    <Input
                      id="razorpayKeyId"
                      value={settings.payment.razorpayKeyId}
                      onChange={(e) => updateSettings("payment", "razorpayKeyId", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="razorpayKeySecret">Key Secret</Label>
                    <Input
                      id="razorpayKeySecret"
                      type="password"
                      value={settings.payment.razorpayKeySecret}
                      onChange={(e) => updateSettings("payment", "razorpayKeySecret", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-4">PayPal</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paypalClientId">Client ID</Label>
                    <Input
                      id="paypalClientId"
                      value={settings.payment.paypalClientId}
                      onChange={(e) => updateSettings("payment", "paypalClientId", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paypalClientSecret">Client Secret</Label>
                    <Input
                      id="paypalClientSecret"
                      type="password"
                      value={settings.payment.paypalClientSecret}
                      onChange={(e) => updateSettings("payment", "paypalClientSecret", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-4">Stripe</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stripePublishableKey">Publishable Key</Label>
                    <Input
                      id="stripePublishableKey"
                      value={settings.payment.stripePublishableKey}
                      onChange={(e) => updateSettings("payment", "stripePublishableKey", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stripeSecretKey">Secret Key</Label>
                    <Input
                      id="stripeSecretKey"
                      type="password"
                      value={settings.payment.stripeSecretKey}
                      onChange={(e) => updateSettings("payment", "stripeSecretKey", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shiprocketEmail">Shiprocket Email</Label>
                  <Input
                    id="shiprocketEmail"
                    type="email"
                    value={settings.shipping.shiprocketEmail}
                    onChange={(e) => updateSettings("shipping", "shiprocketEmail", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="shiprocketPassword">Shiprocket Password</Label>
                  <Input
                    id="shiprocketPassword"
                    type="password"
                    value={settings.shipping.shiprocketPassword}
                    onChange={(e) => updateSettings("shipping", "shiprocketPassword", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (₹)</Label>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    value={settings.shipping.freeShippingThreshold}
                    onChange={(e) =>
                      updateSettings("shipping", "freeShippingThreshold", Number.parseFloat(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="defaultShippingCost">Default Shipping Cost (₹)</Label>
                  <Input
                    id="defaultShippingCost"
                    type="number"
                    value={settings.shipping.defaultShippingCost}
                    onChange={(e) =>
                      updateSettings("shipping", "defaultShippingCost", Number.parseFloat(e.target.value))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Feature Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableRegistration">Enable User Registration</Label>
                  <p className="text-sm text-gray-500">Allow new users to register accounts</p>
                </div>
                <Switch
                  id="enableRegistration"
                  checked={settings.features.enableRegistration}
                  onCheckedChange={(checked) => updateSettings("features", "enableRegistration", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableGuestCheckout">Enable Guest Checkout</Label>
                  <p className="text-sm text-gray-500">Allow users to checkout without creating an account</p>
                </div>
                <Switch
                  id="enableGuestCheckout"
                  checked={settings.features.enableGuestCheckout}
                  onCheckedChange={(checked) => updateSettings("features", "enableGuestCheckout", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableReviews">Enable Product Reviews</Label>
                  <p className="text-sm text-gray-500">Allow customers to leave product reviews</p>
                </div>
                <Switch
                  id="enableReviews"
                  checked={settings.features.enableReviews}
                  onCheckedChange={(checked) => updateSettings("features", "enableReviews", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableWishlist">Enable Wishlist</Label>
                  <p className="text-sm text-gray-500">Allow users to save products to wishlist</p>
                </div>
                <Switch
                  id="enableWishlist"
                  checked={settings.features.enableWishlist}
                  onCheckedChange={(checked) => updateSettings("features", "enableWishlist", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableCoupons">Enable Coupons</Label>
                  <p className="text-sm text-gray-500">Allow discount coupons and promotional codes</p>
                </div>
                <Switch
                  id="enableCoupons"
                  checked={settings.features.enableCoupons}
                  onCheckedChange={(checked) => updateSettings("features", "enableCoupons", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableInventoryTracking">Enable Inventory Tracking</Label>
                  <p className="text-sm text-gray-500">Track product stock levels and availability</p>
                </div>
                <Switch
                  id="enableInventoryTracking"
                  checked={settings.features.enableInventoryTracking}
                  onCheckedChange={(checked) => updateSettings("features", "enableInventoryTracking", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={settings.seo.metaTitle}
                  onChange={(e) => updateSettings("seo", "metaTitle", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={settings.seo.metaDescription}
                  onChange={(e) => updateSettings("seo", "metaDescription", e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input
                  id="metaKeywords"
                  value={settings.seo.metaKeywords}
                  onChange={(e) => updateSettings("seo", "metaKeywords", e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                  <Input
                    id="googleAnalyticsId"
                    value={settings.seo.googleAnalyticsId}
                    onChange={(e) => updateSettings("seo", "googleAnalyticsId", e.target.value)}
                    placeholder="GA-XXXXXXXXX-X"
                  />
                </div>
                <div>
                  <Label htmlFor="facebookPixelId">Facebook Pixel ID</Label>
                  <Input
                    id="facebookPixelId"
                    value={settings.seo.facebookPixelId}
                    onChange={(e) => updateSettings("seo", "facebookPixelId", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
