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
import { Search, User, Menu } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/cart-context"
import { InlineSearch } from "@/components/search/inline-search"
import { Logo } from "@/components/layout/logo"

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const { itemCount: cartCount } = useCart()



  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div className="flex flex-col w-full">
        {/* Top Bar — Navy background like Robu.in */}
        <div className="bg-[#111827] py-1.5 text-[11px] text-white/80">
          <div className="container mx-auto px-4 flex justify-between items-center font-medium">
            <div className="flex items-center space-x-4 md:space-x-6">
              <Link suppressHydrationWarning href="/offers" className="hover:text-[#F38508] transition-colors">Offers</Link>
              <Link suppressHydrationWarning href="/fanbook" className="hidden md:inline hover:text-[#F38508] transition-colors">Fanbook</Link>
              <Link suppressHydrationWarning href="/apps" className="flex items-center hover:text-[#F38508] transition-colors">
                <span className="hidden md:inline mr-1">Download App</span>
                <span className="md:hidden">App</span>
              </Link>
              <Link suppressHydrationWarning href="/stores" className="hidden md:inline hover:text-[#F38508] transition-colors">Find a store near me</Link>
            </div>
            <div className="flex items-center space-x-4 md:space-x-6">
              <Link suppressHydrationWarning href="/contact" className="hover:text-[#F38508] transition-colors">Contact Us</Link>
              <Link suppressHydrationWarning href="/track-order" className="hover:text-[#F38508] transition-colors">Track Order</Link>
            </div>
          </div>
        </div>

        {/* Main Header — white with navy text */}
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">
            {/* Left: Logo & Menu */}
            <div className="flex items-center gap-6 lg:gap-8">
              {/* Mobile Menu Trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden -ml-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <div className="flex flex-col space-y-6 mt-8">
                    <div className="px-2">
                      <Logo width={130} height={32} textColor="#111111" />
                    </div>
                    <nav className="flex flex-col space-y-2">
                      <Link href="/products?category=Men" className="px-4 py-3 hover:bg-muted rounded-md font-medium text-lg">Men</Link>
                      <Link href="/products?category=Women" className="px-4 py-3 hover:bg-muted rounded-md font-medium text-lg">Women</Link>
                      <Link href="/products?category=Mobile%20Covers" className="px-4 py-3 hover:bg-muted rounded-md font-medium text-lg">Mobile Covers</Link>
                      <hr className="my-2" />
                      <Link href="/account" className="px-4 py-3 hover:bg-muted rounded-md font-medium">My Account</Link>
                      <Link href="/contact" className="px-4 py-3 hover:bg-muted rounded-md font-medium">Contact Us</Link>
                      {session ? (
                        <div onClick={handleSignOut} className="px-4 py-3 hover:bg-muted rounded-md font-medium cursor-pointer text-red-500">Sign Out</div>
                      ) : (
                        <Link href="/auth/login" className="px-4 py-3 hover:bg-muted rounded-md font-medium text-primary">Login</Link>
                      )}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Logo */}
              <Link href="/" className="flex-shrink-0 flex items-center">
                <Logo width={140} height={36} textColor="#111111" />
              </Link>

              {/* Desktop Navigation — Navy underline on hover */}
              <nav className="hidden lg:flex items-center space-x-6 text-sm font-semibold tracking-wide uppercase">
                <Link suppressHydrationWarning href="/products?category=Men" className="text-[#111827] hover:text-[#F38508] border-b-2 border-transparent hover:border-[#F38508] py-7 transition-all">
                  Men
                </Link>
                <Link suppressHydrationWarning href="/products?category=Women" className="text-[#111827] hover:text-[#F38508] border-b-2 border-transparent hover:border-[#F38508] py-7 transition-all">
                  Women
                </Link>
                <Link suppressHydrationWarning href="/products?category=Mobile%20Covers" className="text-[#111827] hover:text-[#F38508] border-b-2 border-transparent hover:border-[#F38508] py-7 transition-all">
                  Mobile Covers
                </Link>
              </nav>
            </div>

            {/* Right: Search & Actions */}
            <div className="flex items-center flex-1 justify-end gap-2 md:gap-4">

              {/* Search Bar (Desktop) */}
              <div className="hidden md:block flex-1 max-w-xl mx-2">
                <InlineSearch />
              </div>

              <div className="flex items-center gap-1 md:gap-3 text-muted-foreground">
                {/* Mobile Search Icon */}
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileSearchOpen(true)}>
                  <Search className="h-5 w-5" />
                </Button>

                <div className="hidden md:flex items-center h-8 w-[1px] bg-border mx-1"></div>

                {/* Login / User */}
                {session ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="hidden md:flex flex-col gap-0.5 h-auto px-2 py-1 items-center hover:bg-transparent hover:text-foreground">
                        <User className="h-5 w-5" />
                        {/* <span className="text-[10px] font-medium">Profile</span> */}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-2">
                      <DropdownMenuItem asChild>
                        <Link suppressHydrationWarning href="/account/profile">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link suppressHydrationWarning href="/account/orders">Orders</Link>
                      </DropdownMenuItem>

                      {session.user?.role === "admin" && (
                        <DropdownMenuItem asChild>
                          <Link suppressHydrationWarning href="/admin">Admin Dashboard</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link suppressHydrationWarning href="/auth/login" className="hidden md:block text-xs font-bold hover:underline px-2">
                    Login
                  </Link>
                )}

                {/* Heart / Wishlist */}
                <Link href="/wishlist">
                  <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9 text-muted-foreground hover:text-foreground">
                    <span className="sr-only">Wishlist</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                  </Button>
                </Link>

                {/* Cart */}
                <CartSheet>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 text-[#111827] hover:text-[#F38508]">
                    <ShoppingBagIcon className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute top-0 right-0 h-4 w-4 bg-[#F38508] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </CartSheet>

                {/* Flag / Region (Optional - mimicking Bewakoof's possible region selector or just placeholder) */}
                <div className="hidden lg:flex items-center justify-center h-8 w-8">
                  <span className="text-lg">🇮🇳</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Header strip — Robu.in style with navy border */}
          <div className="w-full border-t border-gray-100 hidden md:block bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="flex items-center space-x-6 h-9 text-xs font-semibold text-[#111827] overflow-x-auto scrollbar-hide uppercase tracking-wider">
                <Link suppressHydrationWarning href="/products?sort=trending" className="whitespace-nowrap hover:text-[#F38508] transition-colors">🔴 LIVE NOW</Link>
                <Link suppressHydrationWarning href="/products?category=Men" className="whitespace-nowrap hover:text-[#F38508] transition-colors">MEN</Link>
                <Link suppressHydrationWarning href="/products?category=Women" className="whitespace-nowrap hover:text-[#F38508] transition-colors">WOMEN</Link>
                <Link suppressHydrationWarning href="/products?category=Accessories" className="whitespace-nowrap hover:text-[#F38508] transition-colors">ACCESSORIES</Link>
                <Link suppressHydrationWarning href="/products?sale=true" className="whitespace-nowrap text-[#F38508] hover:text-[#D97706] transition-colors font-bold">SALE</Link>
                <Link suppressHydrationWarning href="/products?category=Plus%20Size" className="whitespace-nowrap hover:text-[#F38508] transition-colors">PLUS SIZE</Link>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Mobile full-screen search overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[300] bg-white flex flex-col md:hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-white">
            <button onClick={() => setMobileSearchOpen(false)} className="p-2 rounded hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className="flex-1">
              <InlineSearch onFocusChange={(f) => { if (!f) setMobileSearchOpen(false) }} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ShoppingBagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}
