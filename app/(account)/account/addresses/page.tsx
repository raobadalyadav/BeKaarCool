"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MapPin, Plus, Edit2, Trash2, Loader2, Home, Briefcase, AlertCircle, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as usersApi from "@/lib/api/users"
import type { AddressDto } from "@/lib/api/types"

/* ── Indian states ─────────────────────────────────────────────── */
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
]

/* ── blank form ─────────────────────────────────────────────────── */
const BLANK = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
}

type FormData = typeof BLANK

function validate(f: FormData): Partial<Record<keyof FormData, string>> {
  const err: Partial<Record<keyof FormData, string>> = {}
  if (!f.name.trim()) err.name = "Full name is required"
  if (!f.phone.trim() || !/^\d{10}$/.test(f.phone.trim())) err.phone = "Enter a valid 10-digit mobile number"
  if (!f.line1.trim()) err.line1 = "Address line 1 is required"
  if (!f.city.trim()) err.city = "City is required"
  if (!f.state) err.state = "State is required"
  if (!f.pincode.trim() || !/^\d{6}$/.test(f.pincode.trim())) err.pincode = "Enter a valid 6-digit pincode"
  return err
}

/* ── Address card ───────────────────────────────────────────────── */
function AddrCard({
  addr, onEdit, onDelete,
}: { addr: AddressDto; onEdit: (a: AddressDto) => void; onDelete: (id: string) => Promise<void> }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete(addr.id) }
    finally { setDeleting(false) }
  }

  return (
    <Card className={`relative overflow-hidden transition-shadow hover:shadow-md ${addr.isDefault ? "border-[#F38508] border-2" : ""}`}>
      {addr.isDefault && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-orange-100 text-[#D97706] border-orange-200 gap-1 text-[10px]">
            <Star className="w-2.5 h-2.5 fill-current" /> Default
          </Badge>
        </div>
      )}
      <CardContent className="p-5 pt-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Home className="w-4 h-4 text-[#F38508]" />
          </div>
          <div className="min-w-0 pr-16">
            <p className="font-bold text-gray-900">{addr.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{addr.phone}</p>
          </div>
        </div>
        <div className="text-sm text-gray-600 space-y-0.5 mb-4 ml-12">
          <p>{addr.line1}</p>
          {addr.line2 && <p>{addr.line2}</p>}
          <p>{addr.city}, {addr.state} — {addr.pincode}</p>
          <p className="text-gray-400 text-xs">{addr.country}</p>
        </div>
        <div className="flex gap-2 ml-12">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onEdit(addr)}>
            <Edit2 className="w-3 h-3 mr-1" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs text-red-600 border-red-200 hover:bg-red-50">
                {deleting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1" />}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this address?</AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>{addr.name}</strong> — {addr.line1}, {addr.city} will be removed permanently.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Field with error ────────────────────────────────────────────── */
function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function AddressesPage() {
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<AddressDto[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(BLANK)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const fetchAddresses = useCallback(async () => {
    try {
      setAddresses(await usersApi.myAddresses())
    } catch {
      toast({ title: "Could not load addresses", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchAddresses() }, [fetchAddresses])

  const setField = <K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm((f) => ({ ...f, [key]: val }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  /* pincode autofill */
  const handlePincode = async (pincode: string) => {
    const clean = pincode.replace(/\D/g, "").slice(0, 6)
    setField("pincode", clean)
    if (clean.length === 6) {
      setPincodeLoading(true)
      try {
        const result = await usersApi.resolvePincode(clean)
        if (result) {
          setForm((f) => ({ ...f, city: result.city, state: result.state, pincode: clean }))
          setErrors((e) => ({ ...e, city: undefined, state: undefined, pincode: undefined }))
          toast({ title: "Location auto-filled", description: `${result.city}, ${result.state}` })
        }
      } catch {
        // silent – user can fill manually
      } finally {
        setPincodeLoading(false)
      }
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(BLANK)
    setErrors({})
  }

  const startEdit = (addr: AddressDto) => {
    setEditingId(addr.id)
    setForm({
      name: addr.name,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 ?? "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    })
    setErrors({})
    setShowForm(true)
    setTimeout(() => document.getElementById("addr-name")?.focus(), 50)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSubmitting(true)
    try {
      if (editingId) {
        await usersApi.deleteAddress(editingId)
      }
      await usersApi.createAddress({
        name: form.name.trim(),
        phone: form.phone.trim(),
        line1: form.line1.trim(),
        line2: form.line2.trim() || undefined,
        city: form.city.trim(),
        state: form.state,
        pincode: form.pincode.trim(),
        country: "IN",
        isDefault: form.isDefault,
      })
      toast({ title: editingId ? "Address updated" : "Address added" })
      resetForm()
      fetchAddresses()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Could not save address", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    await usersApi.deleteAddress(id)
    toast({ title: "Address deleted" })
    fetchAddresses()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{addresses.length} saved address{addresses.length !== 1 ? "es" : ""}</p>
        </div>
        {!showForm && (
          <Button
            onClick={() => { resetForm(); setShowForm(true); setTimeout(() => document.getElementById("addr-name")?.focus(), 50) }}
            className="bg-[#F38508] hover:bg-[#D97706] text-black font-bold"
          >
            <Plus className="w-4 h-4 mr-2" /> Add New Address
          </Button>
        )}
      </div>

      {/* Address form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4 text-[#F38508]" />
              {editingId ? "Edit Address" : "Add New Address"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" required error={errors.name}>
                  <Input
                    id="addr-name"
                    placeholder="Recipient's full name"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    className={errors.name ? "border-red-400" : ""}
                  />
                </Field>
                <Field label="Phone Number" required error={errors.phone}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">+91</span>
                    <Input
                      type="tel"
                      placeholder="10-digit number"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className={`pl-12 ${errors.phone ? "border-red-400" : ""}`}
                      maxLength={10}
                    />
                  </div>
                </Field>
              </div>

              <Field label="Address Line 1" required error={errors.line1}>
                <Input
                  placeholder="House/Flat/Block No., Building Name, Street"
                  value={form.line1}
                  onChange={(e) => setField("line1", e.target.value)}
                  className={errors.line1 ? "border-red-400" : ""}
                />
              </Field>

              <Field label="Address Line 2" error={undefined}>
                <Input
                  placeholder="Landmark, Area (optional)"
                  value={form.line2}
                  onChange={(e) => setField("line2", e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Pincode" required error={errors.pincode}>
                  <div className="relative">
                    <Input
                      type="tel"
                      placeholder="6-digit pincode"
                      value={form.pincode}
                      onChange={(e) => handlePincode(e.target.value)}
                      className={errors.pincode ? "border-red-400" : ""}
                      maxLength={6}
                    />
                    {pincodeLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                    )}
                  </div>
                </Field>
                <Field label="City" required error={errors.city}>
                  <Input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    className={errors.city ? "border-red-400" : ""}
                  />
                </Field>
                <Field label="State" required error={errors.state}>
                  <Select value={form.state} onValueChange={(v) => setField("state", v)}>
                    <SelectTrigger className={errors.state ? "border-red-400" : ""}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {INDIAN_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="isDefault"
                  checked={form.isDefault}
                  onCheckedChange={(checked) => setField("isDefault", !!checked)}
                />
                <Label htmlFor="isDefault" className="cursor-pointer text-sm font-normal">
                  Set as my default delivery address
                </Label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#F38508] hover:bg-[#D97706] text-black font-bold"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {submitting ? "Saving…" : editingId ? "Update Address" : "Save Address"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Address list */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-14 text-center">
            <MapPin className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No saved addresses</h3>
            <p className="text-gray-400 text-sm mt-1">Add an address for faster checkout</p>
            <Button
              className="mt-5 bg-[#F38508] hover:bg-[#D97706] text-black font-bold"
              onClick={() => { resetForm(); setShowForm(true) }}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <AddrCard key={addr.id} addr={addr} onEdit={startEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
