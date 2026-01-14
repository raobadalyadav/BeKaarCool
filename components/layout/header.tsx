"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CartSheet } from "@/components/cart/cart-sheet"
import { useLanguage } from "@/contexts/language-context"
import { useCurrency } from "@/contexts/currency-context"
import { Search, ShoppingCart, User, Menu, Globe, DollarSign, Sun, Moon, Palette, Store } from "lucide-react"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { useAppSelector, useAppDispatch } from "@/store"
import { fetchCart, loadFromStorage } from "@/store/slices/cart-slice"
import { EnhancedSearch } from "@/components/search/enhanced-search"
import { CommandSearch } from "@/components/search/command-search"

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const { language, setLanguage, t } = useLanguage()
  const { currency, setCurrency } = useCurrency()
  const { theme, setTheme } = useTheme()
  const [commandOpen, setCommandOpen] = useState(false)


  const { items } = useAppSelector((state) => state.cart)
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const currencies = [
    { code: "INR", symbol: "₹", rate: 1 },
    { code: "USD", symbol: "$", rate: 0.012 },
    { code: "EUR", symbol: "€", rate: 0.011 },
    { code: "GBP", symbol: "£", rate: 0.0095 },
  ]

  useEffect(() => {
    if (session) {
      dispatch(fetchCart())
    } else {
      dispatch(loadFromStorage())
    }
  }, [session, dispatch])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])



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
        {/* Top Bar Utilities */}
        <div className="bg-muted/30 py-1 border-b text-[10px] md:text-xs">
          <div className="container mx-auto px-4 flex justify-between items-center text-muted-foreground font-medium">
            <div className="flex items-center space-x-4 md:space-x-6">
              <Link href="/offers" className="hover:text-primary transition-colors">Offers</Link>
              <Link href="/fanbook" className="hidden md:inline hover:text-primary transition-colors">Fanbook</Link>
              <Link href="/apps" className="flex items-center hover:text-primary transition-colors">
                <span className="hidden md:inline mr-1">Download App</span>
                <span className="md:hidden">App</span>
              </Link>
              <Link href="/stores" className="hidden md:inline hover:text-primary transition-colors">Find a store near me</Link>
            </div>
            <div className="flex items-center space-x-4 md:space-x-6">
              <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
              <Link href="/track-order" className="hover:text-primary transition-colors">Track Order</Link>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <header className="sticky top-0 z-50 w-full bg-background border-b shadow-sm">
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
                    <div className="font-bold text-xl px-2">Menu</div>
                    <nav className="flex flex-col space-y-2">
                      <Link href="/products?category=Men" className="px-4 py-3 hover:bg-muted rounded-md font-medium text-lg">Men</Link>
                      <Link href="/products?category=Women" className="px-4 py-3 hover:bg-muted rounded-md font-medium text-lg">Women</Link>
                      <Link href="/products?category=Mobile%20Covers" className="px-4 py-3 hover:bg-muted rounded-md font-medium text-lg">Mobile Covers</Link>
                      <hr className="my-2" />
                      <Link href="/orders" className="px-4 py-3 hover:bg-muted rounded-md font-medium">My Orders</Link>
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
              <Link href="/" className="flex-shrink-0">
                <span className="font-bold text-2xl tracking-tight text-yellow-500">
                  BeKaarCool
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-6 text-sm font-semibold tracking-wide uppercase">
                <Link href="/products?category=Men" className="hover:border-b-4 border-yellow-400 py-7 transition-all">
                  Men
                </Link>
                <Link href="/products?category=Women" className="hover:border-b-4 border-yellow-400 py-7 transition-all">
                  Women
                </Link>
                <Link href="/products?category=Mobile%20Covers" className="hover:border-b-4 border-yellow-400 py-7 transition-all">
                  Mobile Covers
                </Link>
              </nav>
            </div>

            {/* Right: Search & Actions */}
            <div className="flex items-center flex-1 justify-end gap-2 md:gap-4">

              {/* Search Bar (Desktop) */}
              <div className="hidden md:block flex-1 max-w-sm mx-4">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <Input
                    placeholder="Search by product, category or collection"
                    className="bg-muted/40 border-transparent focus:border-border focus:bg-background h-10 w-full pl-10 text-xs font-medium"
                    onClick={() => setCommandOpen(true)}
                    readOnly
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 md:gap-3 text-muted-foreground">
                {/* Mobile Search Icon */}
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setCommandOpen(true)}>
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
                        <Link href="/profile">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/orders">Orders</Link>
                      </DropdownMenuItem>
                      {session.user?.role === "seller" && (
                        <DropdownMenuItem asChild>
                          <Link href="/seller/dashboard">Seller Dashboard</Link>
                        </DropdownMenuItem>
                      )}
                      {session.user?.role === "admin" && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin">Admin Dashboard</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/auth/login" className="hidden md:block text-xs font-bold hover:underline px-2">
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
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
                    <ShoppingBagIcon className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute top-0 right-0 h-4 w-4 bg-yellow-400 text-black text-[10px] font-bold flex items-center justify-center rounded-full">
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

          {/* Sub-Header / Mega Menu Categories Mockup (Optional) */}
          <div className="w-full border-t hidden md:block">
            <div className="container mx-auto px-4">
              <div className="flex items-center space-x-6 h-10 text-xs font-medium text-muted-foreground overflow-x-auto no-scrollbar">
                <Link href="/products?sort=trending" className="whitespace-nowrap hover:text-foreground">LIVE NOW</Link>
                <Link href="/products?category=Men" className="whitespace-nowrap hover:text-foreground">MEN</Link>
                <Link href="/products?category=Women" className="whitespace-nowrap hover:text-foreground">WOMEN</Link>
                <Link href="/products?category=Accessories" className="whitespace-nowrap hover:text-foreground">ACCESSORIES</Link>
                <Link href="/products?sale=true" className="whitespace-nowrap hover:text-foreground">WINTERWEAR</Link>
                <Link href="/products?category=Plus%20Size" className="whitespace-nowrap hover:text-foreground">PLUS SIZE</Link>
              </div>
            </div>
          </div>
        </header>
      </div>

      <CommandSearch open={commandOpen} onOpenChange={setCommandOpen} />
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
