"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Store, Users, TrendingUp, Shield, CheckCircle, Upload, ChevronRight, ChevronLeft, Building, MapPin, CreditCard, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function SellerRegisterPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Business Info
    businessName: "",
    businessType: "individual",
    businessEmail: "",
    businessPhone: "",
    name: "", // Owner name (usually from session, but can be separate)
    description: "",

    // Address
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",

    // Bank Details
    accountHolderName: "",
    bankAccount: "",
    ifscCode: "",
    bankName: "",

    // Documents
    gstNumber: "",
    panNumber: "",
    tourAccepted: false
  })

  // Pre-fill email/name from session if available
  // useEffect(() => {
  //   if (session?.user) {
  //     setFormData(prev => ({ 
  //       ...prev, 
  //       businessEmail: prev.businessEmail || session.user.email || "",
  //       name: prev.name || session.user.name || "" 
  //     }))
  //   }
  // }, [session])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    // Validation logic per step
    if (step === 1 && (!formData.businessName || !formData.businessPhone)) {
      toast({ title: "Missing fields", description: "Please fill in all required business details", variant: "destructive" })
      return
    }
    if (step === 2 && (!formData.address || !formData.city || !formData.state || !formData.pincode)) {
      toast({ title: "Missing fields", description: "Please fill in all address details", variant: "destructive" })
      return
    }
    if (step === 3 && (!formData.bankAccount || !formData.ifscCode)) {
      toast({ title: "Missing fields", description: "Please fill in bank details", variant: "destructive" })
      return
    }

    setStep(prev => prev + 1)
    window.scrollTo(0, 0)
  }

  const prevStep = () => {
    setStep(prev => prev - 1)
    window.scrollTo(0, 0)
  }

  const handleSubmit = async () => {
    if (!formData.gstNumber && !formData.panNumber) {
      toast({ title: "Missing Documents", description: "Please provide at least PAN Number", variant: "destructive" })
      return
    }
    if (!formData.tourAccepted) {
      toast({ title: "Terms Check", description: "Please accept the terms and conditions", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/auth/register-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Application Submitted!",
          description: "Your seller account has been created successfully."
        })
        // Redirect to seller dashboard
        setTimeout(() => router.push("/seller"), 2000)
      } else {
        throw new Error(data.message || "Registration failed")
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { id: 1, title: "Business Info", icon: Building },
    { id: 2, title: "Address", icon: MapPin },
    { id: 3, title: "Bank Details", icon: CreditCard },
    { id: 4, title: "Documents", icon: FileText }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">BeKaarCool Seller</span>
          </div>
          <div className="text-sm text-gray-500">
            Already a seller? <Link href="/auth/login" className="text-blue-600 hover:underline">Login</Link>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl py-12 flex-1">
        <div className="mb-8 p-4">
          <h1 className="text-3xl font-bold text-center mb-2">Become a Seller</h1>
          <p className="text-center text-gray-600">Complete your profile to start selling on BeKaarCool</p>
        </div>

        {/* Steps Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
            {steps.map((s) => (
              <div key={s.id} className={`flex flex-col items-center bg-white px-2 ${step >= s.id ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${step >= s.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar / Help */}
          <div className="hidden lg:block space-y-6">
            <Card className="bg-blue-50 border-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-800">Why Sell With Us?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Users className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Reach Millions</h4>
                    <p className="text-xs text-blue-700">Access to our growing customer base instantly.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Grow Faster</h4>
                    <p className="text-xs text-blue-700">Powerful tools and analytics to boost sales.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Shield className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Secure Payments</h4>
                    <p className="text-xs text-blue-700">Timely payments directly to your bank account.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{steps[step - 1].title}</CardTitle>
                <CardDescription>Step {step} of 4</CardDescription>
              </CardHeader>
              <CardContent>
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Business Name *</Label>
                        <Input
                          value={formData.businessName}
                          onChange={(e) => handleInputChange("businessName", e.target.value)}
                          placeholder="Enter your store name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Business Type</Label>
                        <Select
                          value={formData.businessType}
                          onValueChange={(val) => handleInputChange("businessType", val)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="proprietorship">Proprietorship</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="pvt_ltd">Private Ltd</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Business Email</Label>
                        <Input
                          type="email"
                          value={formData.businessEmail}
                          onChange={(e) => handleInputChange("businessEmail", e.target.value)}
                          placeholder="contact@store.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Phone *</Label>
                        <Input
                          value={formData.businessPhone}
                          onChange={(e) => handleInputChange("businessPhone", e.target.value)}
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Tell us a bit about what you sell..."
                        rows={4}
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Address Line *</Label>
                      <Textarea
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="Shop No, Street, Landmark"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>City *</Label>
                        <Input
                          value={formData.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>State *</Label>
                        <Input
                          value={formData.state}
                          onChange={(e) => handleInputChange("state", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pincode *</Label>
                        <Input
                          value={formData.pincode}
                          onChange={(e) => handleInputChange("pincode", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Account Holder Name *</Label>
                        <Input
                          value={formData.accountHolderName}
                          onChange={(e) => handleInputChange("accountHolderName", e.target.value)}
                          placeholder="Name as per bank records"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input
                          value={formData.bankName}
                          onChange={(e) => handleInputChange("bankName", e.target.value)}
                          placeholder="e.g. HDFC Bank"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Account Number *</Label>
                        <Input
                          type="password"
                          value={formData.bankAccount}
                          onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>IFSC Code *</Label>
                        <Input
                          value={formData.ifscCode}
                          onChange={(e) => handleInputChange("ifscCode", e.target.value)}
                          placeholder="HDFC0001234"
                          className="uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>PAN Number *</Label>
                        <Input
                          value={formData.panNumber}
                          onChange={(e) => handleInputChange("panNumber", e.target.value)}
                          placeholder="ABCDE1234F"
                          className="uppercase"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>GST Number (Optional)</Label>
                        <Input
                          value={formData.gstNumber}
                          onChange={(e) => handleInputChange("gstNumber", e.target.value)}
                          placeholder="22AAAAA0000A1Z5"
                          className="uppercase"
                        />
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-2">Verification Notice</h4>
                      <p className="text-sm text-yellow-700">
                        Your account will be in "Pending" status until our team verifies your documents.
                        You can start listing products immediately, but they will only go live once your account is approved.
                      </p>
                    </div>

                    <div className="flex items-start space-x-2 pt-4">
                      <Checkbox
                        id="terms"
                        checked={formData.tourAccepted}
                        onCheckedChange={(c) => handleInputChange("tourAccepted", c)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="terms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Accept terms and conditions
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          I agree to the Seller Terms of Service and Privacy Policy.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1 || isSubmitting}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                {step < 4 ? (
                  <Button onClick={nextStep}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                    {isSubmitting ? (
                      <>Processing...</>
                    ) : (
                      <>
                        Submit Application
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}