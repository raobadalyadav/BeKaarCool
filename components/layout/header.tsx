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
import { useLanguage } from "@/contexts/language-context"
import { useCurrency } from "@/contexts/currency-context"
import { Search, ShoppingCart, User, Menu, Globe, DollarSign, Sun, Moon, Palette, Store } from "lucide-react"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { useAppSelector, useAppDispatch } from "@/store"
import { fetchCart } from "@/store/slices/cart-slice"
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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Top Section - Logo, Search, Actions */}
        <div className="border-b border-border/40">
          <div className="container flex h-14 md:h-16 items-center justify-between px-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="h-7 w-7 md:h-8 md:w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs md:text-sm">B</span>
              </div>
              <span className="font-bold text-lg md:text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                BeKaarCool
              </span>
            </Link>

            {/* Enhanced Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl mx-6 lg:mx-8">
              <div className="relative w-full">
                <EnhancedSearch className="w-full" />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden lg:flex items-center gap-1 text-xs text-muted-foreground">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-1 md:space-x-2">
              {/* Mobile Search */}
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setCommandOpen(true)}>
                <Search className="h-4 w-4" />
              </Button>

              {/* Cart */}
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-blue-600">
                      {cartCount > 99 ? "99+" : cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* User Menu */}
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="hidden lg:inline max-w-20 truncate text-sm">{session.user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="flex items-center">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    {session.user?.role === "seller" && (
                      <DropdownMenuItem asChild>
                        <Link href="/seller/dashboard" className="flex items-center">
                          <Store className="mr-2 h-4 w-4" />
                          Seller Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {session.user?.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                          <Store className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-1 md:space-x-2">
                  <Button variant="ghost" size="sm" asChild className="text-sm">
                    <Link href="/auth/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild className="text-sm">
                    <Link href="/auth/register">Sign Up</Link>
                  </Button>
                </div>
              )}

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col space-y-4 mt-8">
                    {/* Mobile Navigation */}
                    <Link href="/products" className="text-lg font-medium py-2 hover:text-primary transition-colors">
                      Products
                    </Link>
                    <Link href="/categories" className="text-lg font-medium py-2 hover:text-primary transition-colors">
                      Categories
                    </Link>
                    <Link href="/about" className="text-lg font-medium py-2 hover:text-primary transition-colors">
                      About
                    </Link>
                    <Link href="/contact" className="text-lg font-medium py-2 hover:text-primary transition-colors">
                      Contact
                    </Link>

                    {/* Mobile User Actions */}
                    {session ? (
                      <div className="space-y-2 pt-4 border-t">
                        <Link href="/profile" className="text-lg font-medium py-2 flex items-center hover:text-primary transition-colors">
                          <User className="h-5 w-5 mr-2" />
                          Profile
                        </Link>
                        <Link href="/orders" className="text-lg font-medium py-2 flex items-center hover:text-primary transition-colors">
                          <ShoppingCart className="h-5 w-5 mr-2" />
                          My Orders
                        </Link>
                        {session.user?.role === "seller" && (
                          <Link href="/seller/dashboard" className="text-lg font-medium py-2 flex items-center hover:text-primary transition-colors">
                            <Store className="h-5 w-5 mr-2" />
                            Seller Dashboard
                          </Link>
                        )}
                        {session.user?.role === "admin" && (
                          <Link href="/admin" className="text-lg font-medium py-2 flex items-center hover:text-primary transition-colors">
                            <Store className="h-5 w-5 mr-2" />
                            Admin Dashboard
                          </Link>
                        )}
                        <Button onClick={handleSignOut} variant="outline" className="w-full mt-4">
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-4 border-t">
                        <Button variant="outline" asChild className="w-full">
                          <Link href="/auth/login">Login</Link>
                        </Button>
                        <Button asChild className="w-full">
                          <Link href="/auth/register">Sign Up</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Bottom Section - Navigation */}
        <div className="hidden md:block">
          <div className="container px-4">
            <nav className="flex items-center justify-center space-x-8 h-12">
              <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors flex items-center">
                <ShoppingCart className="h-4 w-4 mr-1" />
                Shop All
              </Link>
              <Link href="/products?category=Fashion" className="text-sm font-medium hover:text-primary transition-colors">
                Fashion
              </Link>
              <Link href="/products?category=Electronics" className="text-sm font-medium hover:text-primary transition-colors">
                Electronics
              </Link>
              <Link href="/products?sale=true" className="text-sm font-medium hover:text-primary transition-colors text-red-600">
                Sale
              </Link>
              <Link href="/products?sort=trending" className="text-sm font-medium hover:text-primary transition-colors">
                Trending
              </Link>
              <Link href="/products?sort=newest" className="text-sm font-medium hover:text-primary transition-colors">
                New Arrivals
              </Link>
            </nav>
          </div>
        </div>
      </header>
      
      <CommandSearch open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  )
}