"use client"

import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
    User, Package, CreditCard, Wallet, MapPin, Settings, HelpCircle, LogOut,
    ChevronRight, Edit2, Home, Gift, Users, Shield, Bell, CheckCircle2
} from "lucide-react"

// Navigation items
const navItems = [
    { id: "overview", label: "Overview", icon: User, href: "/account" },
    { id: "orders", label: "My Orders", icon: Package, href: "/account/orders" },
    { id: "addresses", label: "My Addresses", icon: MapPin, href: "/account/addresses" },
    { id: "wallet", label: "My Wallet", icon: Wallet, href: "/account/wallet" },
    { id: "rewards", label: "My Rewards", icon: Gift, href: "/account/rewards" },
    { id: "referral", label: "Refer & Earn", icon: Users, href: "/account/referral" },
    { id: "payments", label: "My Payments", icon: CreditCard, href: "/account/payments" },
    { id: "notifications", label: "Notifications", icon: Bell, href: "/account/notifications" },
    { id: "security", label: "Security", icon: Shield, href: "/account/security" },
    { id: "profile", label: "My Profile", icon: Settings, href: "/account/profile" },
    { id: "help", label: "Help & Support", icon: HelpCircle, href: "/account/support" },
]

// Breadcrumb mapping
const breadcrumbMap: Record<string, { label: string; parent?: string }> = {
    "/account": { label: "My Account" },
    "/account/orders": { label: "My Orders", parent: "/account" },
    "/account/payments": { label: "My Payments", parent: "/account" },
    "/account/wallet": { label: "My Wallet", parent: "/account" },
    "/account/rewards": { label: "My Rewards", parent: "/account" },
    "/account/referral": { label: "Refer & Earn", parent: "/account" },
    "/account/addresses": { label: "My Addresses", parent: "/account" },
    "/account/profile": { label: "My Profile", parent: "/account" },
    "/account/security": { label: "Security", parent: "/account" },
    "/account/notifications": { label: "Notifications", parent: "/account" },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()
    const pathname = usePathname()

    // Build breadcrumbs
    const buildBreadcrumbs = () => {
        const crumbs: Array<{ label: string; href: string }> = [{ label: "Home", href: "/" }]
        let currentPath = pathname

        const addCrumb = (path: string) => {
            const info = breadcrumbMap[path]
            if (info) {
                if (info.parent) addCrumb(info.parent)
                crumbs.push({ label: info.label, href: path })
            }
        }

        addCrumb(currentPath)
        return crumbs
    }

    const breadcrumbs = buildBreadcrumbs()

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F38508]"></div>
            </div>
        )
    }

    if (!session) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert>
                    <AlertDescription>
                        Please <Link href="/auth/login" className="text-[#F38508] font-semibold underline">log in</Link> to view your account.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const user = session.user
    const currentNav = navItems.find(item => pathname === item.href || pathname.startsWith(item.href + "/"))

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500">
                    {breadcrumbs.map((crumb, idx) => (
                        <span key={crumb.href} className="flex items-center gap-2">
                            {idx > 0 && <ChevronRight className="w-4 h-4" />}
                            {idx === breadcrumbs.length - 1 ? (
                                <span className="text-gray-900 font-medium">{crumb.label}</span>
                            ) : (
                                <Link href={crumb.href} className="hover:text-[#F38508] transition-colors">
                                    {idx === 0 ? <Home className="w-4 h-4" /> : crumb.label}
                                </Link>
                            )}
                        </span>
                    ))}
                </nav>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="lg:w-72 flex-shrink-0">
                        {/* User Card */}
                        <div className="bg-white rounded-xl shadow-sm p-5 mb-4 border">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-14 w-14 flex-shrink-0">
                                    <AvatarImage src={(user as { avatar?: string }).avatar ?? ""} />
                                    <AvatarFallback className="bg-gradient-to-br from-[#F38508] to-[#D97706] text-black text-lg font-black">
                                        {(user.name ?? user.email ?? "?").split(" ").map((w: string) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <h2 className="font-bold text-base text-gray-900 truncate">{user.name || "—"}</h2>
                                        {user.emailVerified && (
                                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                                    {(user as { phone?: string }).phone && (
                                        <p className="text-xs text-gray-400 mt-0.5">{(user as { phone?: string }).phone}</p>
                                    )}
                                </div>
                            </div>
                            <Link href="/account/profile">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-4 border-[#F38508] text-[#F38508] hover:bg-orange-50 text-xs"
                                >
                                    <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
                                </Button>
                            </Link>
                        </div>

                        {/* Navigation */}
                        <nav className="bg-white rounded-lg shadow-sm overflow-hidden">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/account" && pathname.startsWith(item.href))
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className={`w-full flex items-center justify-between px-4 py-3 border-b last:border-b-0 transition-colors ${isActive
                                            ? "bg-orange-50 text-[#D97706] border-l-4 border-l-[#F38508]"
                                            : "hover:bg-gray-50 text-gray-700"
                                            }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5" />
                                            {item.label}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </Link>
                                )
                            })}

                            {/* Logout Button */}
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                Logout
                            </button>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}
