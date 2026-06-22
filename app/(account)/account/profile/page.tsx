"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye, EyeOff, User, Phone, Mail, Lock, CheckCircle, AlertCircle, Camera } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as accountApi from "@/lib/api/account"

/* ── password strength ────────────────────────────────────────── */
function getStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "" }
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" }
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-400" }
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-400" }
  return { score, label: "Strong", color: "bg-green-500" }
}

function StrengthBar({ password }: { password: string }) {
  const { score, label, color } = getStrength(password)
  if (!password) return null
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? color : "bg-gray-200"}`} />
        ))}
      </div>
      <p className={`text-[11px] font-medium ${score <= 1 ? "text-red-600" : score <= 2 ? "text-orange-500" : score <= 3 ? "text-yellow-600" : "text-green-600"}`}>
        {label}
      </p>
    </div>
  )
}

/* ── avatar initials ──────────────────────────────────────────── */
function AvatarInitials({ name, email }: { name?: string; email?: string }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
    : (email?.[0] ?? "?").toUpperCase()
  return (
    <div className="relative group">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-3xl font-black text-black shadow-lg">
        {initials}
      </div>
      <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
        <Camera className="w-6 h-6 text-white" />
      </div>
    </div>
  )
}

/* ── password input ───────────────────────────────────────────── */
function PasswordInput({
  value, onChange, placeholder, id,
}: { value: string; onChange: (v: string) => void; placeholder?: string; id?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

/* ── page ─────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { data: session, update } = useSession()
  const { toast } = useToast()
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileDirty, setProfileDirty] = useState(false)

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  })

  const [pwdErrors, setPwdErrors] = useState<{ next?: string; confirm?: string }>({})

  useEffect(() => {
    if (session?.user) {
      const fullName = (session.user.name ?? "").trim()
      const [first, ...rest] = fullName.split(/\s+/)
      setProfileForm({
        firstName: first ?? "",
        lastName: rest.join(" "),
        email: session.user.email ?? "",
        phone: (session.user as { phone?: string }).phone ?? "",
      })
      setProfileDirty(false)
    }
  }, [session])

  const setProfile = (patch: Partial<typeof profileForm>) => {
    setProfileForm((f) => ({ ...f, ...patch }))
    setProfileDirty(true)
  }

  const validatePassword = () => {
    const errors: typeof pwdErrors = {}
    if (passwordForm.next.length < 8) errors.next = "Must be at least 8 characters"
    if (passwordForm.next !== passwordForm.confirm) errors.confirm = "Passwords don't match"
    setPwdErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    const firstName = profileForm.firstName.trim()
    if (!firstName) {
      toast({ title: "First name is required", variant: "destructive" })
      return
    }
    setSavingProfile(true)
    try {
      const updated = await accountApi.updateProfile({
        firstName,
        lastName: profileForm.lastName.trim() || undefined,
        phone: profileForm.phone.trim() || undefined,
      })
      const display = [updated.firstName, updated.lastName].filter(Boolean).join(" ").trim()
      await update({ name: display || updated.email })
      setProfileDirty(false)
      toast({ title: "Profile updated successfully" })
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to save", variant: "destructive" })
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePassword()) return
    setSavingPassword(true)
    try {
      await accountApi.changePassword(passwordForm.current, passwordForm.next)
      toast({ title: "Password updated", description: "Use your new password next time you sign in." })
      setPasswordForm({ current: "", next: "", confirm: "" })
      setPwdErrors({})
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to change password", variant: "destructive" })
    } finally {
      setSavingPassword(false)
    }
  }

  const user = session?.user

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        {session?.user?.emailVerified && (
          <Badge className="bg-green-50 text-green-700 border-green-200 gap-1">
            <CheckCircle className="w-3 h-3" /> Verified
          </Badge>
        )}
      </div>

      {/* Avatar + email banner */}
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <AvatarInitials name={user?.name ?? undefined} email={user?.email ?? undefined} />
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-bold text-gray-900">{user?.name || "—"}</h2>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5 justify-center sm:justify-start">
              <Mail className="w-3.5 h-3.5" /> {user?.email}
            </p>
            <p className="text-xs text-gray-400 mt-2 max-w-xs">
              To change your email address, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4 text-brand-500" /> Personal Information
          </CardTitle>
          <CardDescription>Update your name and phone number</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={profileForm.firstName}
                  onChange={(e) => setProfile({ firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={profileForm.lastName}
                  onChange={(e) => setProfile({ lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  disabled
                  readOnly
                  className="pl-9 bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">+91</span>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={profileForm.phone}
                  onChange={(e) => setProfile({ phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  className="pl-12"
                  maxLength={10}
                />
              </div>
              {profileForm.phone && profileForm.phone.length !== 10 && (
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Phone must be 10 digits
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={savingProfile || !profileDirty}
              className="bg-brand-500 hover:bg-brand-600 text-black font-bold"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {savingProfile ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="w-4 h-4 text-brand-500" /> Change Password
          </CardTitle>
          <CardDescription>Choose a strong password to secure your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current">Current Password <span className="text-red-500">*</span></Label>
              <PasswordInput
                id="current"
                value={passwordForm.current}
                onChange={(v) => setPasswordForm((f) => ({ ...f, current: v }))}
                placeholder="Your current password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next">New Password <span className="text-red-500">*</span></Label>
              <PasswordInput
                id="next"
                value={passwordForm.next}
                onChange={(v) => {
                  setPasswordForm((f) => ({ ...f, next: v }))
                  if (pwdErrors.next) setPwdErrors((e) => ({ ...e, next: undefined }))
                }}
                placeholder="At least 8 characters"
              />
              <StrengthBar password={passwordForm.next} />
              {pwdErrors.next && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {pwdErrors.next}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm New Password <span className="text-red-500">*</span></Label>
              <PasswordInput
                id="confirm"
                value={passwordForm.confirm}
                onChange={(v) => {
                  setPasswordForm((f) => ({ ...f, confirm: v }))
                  if (pwdErrors.confirm) setPwdErrors((e) => ({ ...e, confirm: undefined }))
                }}
                placeholder="Repeat your new password"
              />
              {passwordForm.confirm && passwordForm.next === passwordForm.confirm && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Passwords match
                </p>
              )}
              {pwdErrors.confirm && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {pwdErrors.confirm}
                </p>
              )}
            </div>
            <Button
              type="submit"
              variant="outline"
              disabled={savingPassword || !passwordForm.current || !passwordForm.next || !passwordForm.confirm}
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              {savingPassword ? "Updating…" : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
