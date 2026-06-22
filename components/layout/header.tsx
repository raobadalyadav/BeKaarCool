"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CartSheet } from "@/components/cart/cart-sheet"
import { Search, User, Menu, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/cart-context"
import { InlineSearch } from "@/components/search/inline-search"
import { Logo } from "@/components/layout/logo"

const MARQUEE_TEXT =
  "🚚 Free Delivery on orders above ₹499  |  Use code FIRST10 for 10% off  |  ⚡ 7-Day Easy Returns  |  ✅ 100% Genuine Products  |  🎁 Gift Wrapping Available  |  🔒 Secure Checkout      "

const NAV_STRIP = [
  { label: "All", href: "/products" },
  { label: "Men", href: "/products?category=Men" },
  { label: "Women", href: "/products?category=Women" },
  { label: "Mobile Covers", href: "/products?category=Mobile%20Covers" },
  { label: "Accessories", href: "/products?category=Accessories" },
  { label: "Footwear", href: "/products?category=Footwear" },
  { label: "Hoodies", href: "/products?category=Hoodies" },
  { label: "Sale 🔥", href: "/products?sale=true", highlight: true },
]

const SEARCH_CATEGORIES = ["All", "Men", "Women", "Mobile Covers", "Accessories", "Footwear"]

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [searchCategory, setSearchCategory] = useState("All")
  const { itemCount: cartCount } = useCart()

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      toast({ title: "Signed out", description: "You have been successfully signed out." })
      router.push("/")
    } catch {
      toast({ title: "Error", description: "Failed to sign out. Please try again.", variant: "destructive" })
    }
  }

  return (
    <>
      <div className="flex flex-col w-full">

        {/* ── Announcement marquee bar ───────────────────────────── */}
        <div className="bg-[#F38508] h-7 flex items-center overflow-hidden">
          <div className="animate-marquee text-white text-[11px] font-semibold tracking-wide">
            {/* duplicated for seamless loop */}
            {MARQUEE_TEXT}{MARQUEE_TEXT}
          </div>
        </div>

        {/* ── Main header ───────────────────────────────────────── */}
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 h-16 md:h-[68px] flex items-center gap-3 md:gap-4">

            {/* Mobile hamburger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden -ml-2 flex-shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  <div className="px-5 py-4 border-b">
                    <Logo width={120} height={30} textColor="#111111" />
                  </div>
                  <nav className="flex-1 overflow-y-auto py-3">
                    {NAV_STRIP.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center px-5 py-3 text-sm font-medium border-b border-gray-50 ${item.highlight ? "text-[#F38508]" : "text-gray-800 hover:text-[#F38508]"}`}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="h-px bg-gray-100 my-2" />
                    <Link href="/account" className="flex items-center px-5 py-3 text-sm font-medium text-gray-700 hover:text-[#F38508]">My Account</Link>
                    <Link href="/track-order" className="flex items-center px-5 py-3 text-sm font-medium text-gray-700 hover:text-[#F38508]">Track Order</Link>
                    <Link href="/contact" className="flex items-center px-5 py-3 text-sm font-medium text-gray-700 hover:text-[#F38508]">Contact Us</Link>
                    {session ? (
                      <button onClick={handleSignOut} className="w-full text-left flex items-center px-5 py-3 text-sm font-medium text-red-500">Sign Out</button>
                    ) : (
                      <Link href="/auth/login" className="flex items-center px-5 py-3 text-sm font-medium text-[#F38508]">Login / Register</Link>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Logo width={130} height={34} textColor="#111111" />
            </Link>

            {/* Search bar — center, with category prefix on desktop */}
            <div className="flex-1 hidden md:flex items-center min-w-0">
              <div className="flex items-center w-full max-w-2xl border border-gray-300 rounded-full overflow-hidden bg-white hover:border-[#F38508] transition-colors focus-within:border-[#F38508] focus-within:ring-1 focus-within:ring-[#F38508]/20">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="text-xs bg-gray-50 border-r border-gray-200 px-3 py-2.5 text-gray-600 focus:outline-none cursor-pointer flex-shrink-0 rounded-l-full"
                >
                  {SEARCH_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="flex-1 min-w-0 [&_input]:border-0 [&_input]:rounded-none [&_input]:shadow-none [&_input]:focus:ring-0 [&_input]:bg-transparent">
                  <InlineSearch />
                </div>
              </div>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-0.5 md:gap-1 ml-auto md:ml-0 flex-shrink-0">

              {/* Mobile search */}
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileSearchOpen(true)}>
                <Search className="h-5 w-5 text-gray-700" />
              </Button>

              {/* Login / Account */}
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hidden md:flex">
                      <User className="h-5 w-5 text-gray-700" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 mt-2">
                    <div className="px-3 py-2 text-xs text-gray-500 border-b">{(session.user as any)?.email}</div>
                    <DropdownMenuItem asChild>
                      <Link href="/account/profile">My Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/orders">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wishlist">Wishlist</Link>
                    </DropdownMenuItem>
                    {(session.user as any)?.role !== "customer" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth/login" className="hidden md:flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-[#F38508] px-2 py-1.5 rounded-lg hover:bg-orange-50 transition-colors">
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              )}

              {/* Wishlist */}
              <Link href="/wishlist" className="hidden md:flex">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-700 hover:text-[#F38508]">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>

              {/* Cart */}
              <CartSheet>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 text-gray-700 hover:text-[#F38508]">
                  <ShoppingBagIcon className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-[#F38508] text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Button>
              </CartSheet>

            </div>
          </div>

          {/* ── Category strip ──────────────────────────────────── */}
          <div className="hidden md:block border-t border-gray-100 bg-white">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
                {NAV_STRIP.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors border-b-2 border-transparent hover:border-[#F38508] hover:text-[#F38508] ${
                      item.highlight ? "text-[#F38508] font-bold" : "text-gray-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Mobile full-screen search overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[300] bg-white flex flex-col md:hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div className="flex-1">
              <InlineSearch onFocusChange={(f) => { if (!f) setMobileSearchOpen(false) }} />
            </div>
          </div>
          <div className="px-4 pt-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Quick Links</p>
            <div className="flex flex-wrap gap-2">
              {NAV_STRIP.slice(1).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSearchOpen(false)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${item.highlight ? "border-[#F38508] text-[#F38508]" : "border-gray-200 text-gray-600"}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ShoppingBagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}
