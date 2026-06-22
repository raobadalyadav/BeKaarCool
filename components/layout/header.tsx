"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
import {
  Search, User, Menu, Heart, ShoppingBag, ChevronLeft,
  LogOut, Package, LayoutDashboard, UserCircle, Tag,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/cart-context"
import { useWishlist } from "@/hooks/use-wishlist"
import { InlineSearch } from "@/components/search/inline-search"
import { Logo } from "@/components/layout/logo"
import { listCategories } from "@/lib/api/products"
import type { CategoryDto } from "@/lib/api/types"

const MARQUEE_TEXT =
  "🚚 Free Delivery on orders above ₹499  |  Use code FIRST10 for 10% off  |  ⚡ 7-Day Easy Returns  |  ✅ 100% Genuine Products  |  🎁 Gift Wrapping Available  |  🔒 Secure Checkout      "

/* Fallback static links shown until backend categories load */
const STATIC_NAV: { label: string; href: string; highlight?: boolean }[] = [
  { label: "All", href: "/products" },
  { label: "Men", href: "/products?category=Men" },
  { label: "Women", href: "/products?category=Women" },
  { label: "Mobile Covers", href: "/products?category=Mobile%20Covers" },
  { label: "Accessories", href: "/products?category=Accessories" },
  { label: "Footwear", href: "/products?category=Footwear" },
  { label: "Sale", href: "/products?sale=true", highlight: true },
]

function buildNavFromCategories(
  cats: CategoryDto[]
): { label: string; href: string; highlight?: boolean }[] {
  const top = cats.filter((c) => !c.parentId).slice(0, 7)
  const items = [
    { label: "All", href: "/products" },
    ...top.map((c) => ({
      label: c.name,
      href: `/products?category=${encodeURIComponent(c.name)}`,
    })),
    { label: "Sale 🔥", href: "/products?sale=true", highlight: true as const },
  ]
  return items
}

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [searchCategory, setSearchCategory] = useState("All")
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { itemCount: cartCount } = useCart()
  const { items: wishlistItems } = useWishlist()
  const wishlistCount = wishlistItems.length

  /* Load categories from backend once on mount */
  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => undefined)
  }, [])

  const navItems = categories.length > 0 ? buildNavFromCategories(categories) : STATIC_NAV
  const searchCategories = ["All", ...categories.filter((c) => !c.parentId).map((c) => c.name).slice(0, 6)]

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      toast({ title: "Signed out successfully" })
      router.push("/")
    } catch {
      toast({ title: "Sign out failed", variant: "destructive" })
    }
  }

  /* Close mobile search when navigating */
  useEffect(() => {
    setMobileSearchOpen(false)
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <>
      <div className="flex flex-col w-full">

        {/* Announcement marquee */}
        <div className="bg-charcoal-900 h-7 flex items-center overflow-hidden">
          <div className="animate-marquee text-brand-500 text-[11px] font-semibold tracking-wide whitespace-nowrap">
            {MARQUEE_TEXT}{MARQUEE_TEXT}
          </div>
        </div>

        {/* Main header */}
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
          <div className="container h-16 md:h-[68px] flex items-center gap-3 md:gap-4">

            {/* Mobile hamburger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
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
                  <nav className="flex-1 overflow-y-auto py-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center px-5 py-3 text-sm font-medium border-b border-gray-50 ${
                          item.highlight ? "text-brand-500" : "text-gray-800 hover:text-brand-500"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="h-px bg-gray-100 my-2" />
                    {session ? (
                      <>
                        <Link href="/account/profile" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:text-brand-500">
                          <UserCircle className="w-4 h-4" /> My Profile
                        </Link>
                        <Link href="/account/orders" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:text-brand-500">
                          <Package className="w-4 h-4" /> My Orders
                        </Link>
                        <Link href="/wishlist" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:text-brand-500">
                          <Heart className="w-4 h-4" /> Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                        </Link>
                        {(session.user as any)?.role !== "customer" && (
                          <Link href="/admin/dashboard" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:text-brand-500">
                            <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-red-500 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/auth/login" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-brand-500">
                          <User className="w-4 h-4" /> Login / Register
                        </Link>
                        <Link href="/track-order" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:text-brand-500">
                          <Package className="w-4 h-4" /> Track Order
                        </Link>
                      </>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Logo width={130} height={34} textColor="#111111" />
            </Link>

            {/* Search bar — desktop with category prefix */}
            <div className="flex-1 hidden md:flex items-center min-w-0">
              <div className="flex items-center w-full max-w-2xl border border-gray-300 rounded-full overflow-hidden bg-white hover:border-brand-500 transition-colors focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/20">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="text-xs bg-gray-50 border-r border-gray-200 px-3 py-2.5 text-gray-600 focus:outline-none cursor-pointer flex-shrink-0 rounded-l-full"
                >
                  {searchCategories.map((c) => (
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

              {/* Mobile search toggle */}
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileSearchOpen(true)}>
                <Search className="h-5 w-5 text-gray-700" />
              </Button>

              {/* Account — desktop */}
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hidden md:flex relative">
                      <User className="h-5 w-5 text-gray-700" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    <div className="px-3 py-2 border-b">
                      <p className="text-xs font-semibold text-gray-900 truncate">{(session.user as any)?.firstName || (session.user as any)?.email?.split("@")[0]}</p>
                      <p className="text-[11px] text-gray-500 truncate">{(session.user as any)?.email}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/account/profile" className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4" /> My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/orders" className="flex items-center gap-2">
                        <Package className="w-4 h-4" /> My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wishlist" className="flex items-center gap-2">
                        <Heart className="w-4 h-4" /> Wishlist
                        {wishlistCount > 0 && <span className="ml-auto text-xs font-bold text-brand-500">{wishlistCount}</span>}
                      </Link>
                    </DropdownMenuItem>
                    {(session.user as any)?.role !== "customer" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin/dashboard" className="flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth/login" className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-brand-500 px-2.5 py-1.5 rounded-lg hover:bg-brand-50 transition-colors">
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              )}

              {/* Wishlist — desktop */}
              <Link href="/wishlist" className="hidden md:flex">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-700 hover:text-brand-500 relative">
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                      {wishlistCount > 9 ? "9+" : wishlistCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Cart */}
              <CartSheet>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 text-gray-700 hover:text-brand-500">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Button>
              </CartSheet>
            </div>
          </div>

          {/* Category strip — desktop */}
          <div className="hidden md:block border-t border-gray-100 bg-white">
            <div className="container">
              <div className="flex items-center overflow-x-auto scrollbar-hide">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors border-b-2 border-transparent hover:border-brand-500 hover:text-brand-500 ${
                      item.highlight ? "text-brand-500 font-bold" : "text-gray-600"
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
              className="p-2 rounded-lg hover:bg-gray-100 flex-shrink-0 text-gray-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <InlineSearch onFocusChange={(f) => { if (!f) setMobileSearchOpen(false) }} />
            </div>
          </div>
          <div className="px-4 pt-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Quick Links</p>
            <div className="flex flex-wrap gap-2">
              {navItems.slice(1).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSearchOpen(false)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    item.highlight ? "border-brand-500 text-brand-500" : "border-gray-200 text-gray-600"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          {/* Category chips from backend */}
          {categories.length > 0 && (
            <div className="px-4 pt-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.filter((c) => !c.parentId).map((c) => (
                  <Link
                    key={c.id}
                    href={`/products?category=${encodeURIComponent(c.name)}`}
                    onClick={() => setMobileSearchOpen(false)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 text-gray-600 hover:border-brand-500 hover:text-brand-500"
                  >
                    {c.name}
                    {c.productCount ? <span className="ml-1 text-gray-400">({c.productCount})</span> : null}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
