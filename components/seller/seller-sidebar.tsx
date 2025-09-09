"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  Store,
  Palette,
  DollarSign,
  MessageSquare,
  FileText,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "Dashboard",
    href: "/seller/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    href: "/seller/products",
    icon: Package,
    badge: "12",
  },
  {
    name: "Orders",
    href: "/seller/orders",
    icon: ShoppingCart,
    badge: "3",
  },
  {
    name: "Analytics",
    href: "/seller/analytics",
    icon: BarChart3,
  },
  {
    name: "Customers",
    href: "/seller/customers",
    icon: Users,
  },
  {
    name: "Designs",
    href: "/seller/designs",
    icon: Palette,
  },
  {
    name: "Revenue",
    href: "/seller/revenue",
    icon: DollarSign,
  },
  {
    name: "Messages",
    href: "/seller/messages",
    icon: MessageSquare,
    badge: "2",
  },
  {
    name: "Reports",
    href: "/seller/reports",
    icon: FileText,
  },
  {
    name: "Marketing",
    href: "/seller/marketing",
    icon: TrendingUp,
  },
  {
    name: "Settings",
    href: "/seller/settings",
    icon: Settings,
  },
]

interface SellerSidebarProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SellerSidebar({ open, onOpenChange }: SellerSidebarProps = {}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => onOpenChange?.(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full flex flex-col bg-white/95 backdrop-blur-xl border-r border-gray-200/50 shadow-xl transition-all duration-300",
          "lg:relative lg:translate-x-0",
          collapsed ? "w-16" : "w-64",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">BeKaarCool</h2>
              <p className="text-xs text-gray-600">Seller Dashboard</p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 p-0 hover:bg-blue-100">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start transition-all duration-200 group",
                  collapsed ? "px-2" : "px-3",
                  isActive 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700" 
                    : "hover:bg-blue-50 hover:text-blue-700",
                )}
              >
                <item.icon className={cn("h-4 w-4", collapsed ? "" : "mr-3")} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <Badge variant={isActive ? "secondary" : "outline"} className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200/50 mt-auto">
        {!collapsed && (
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-6 w-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Boost Sales</span>
            </div>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              Upgrade to premium for advanced analytics and marketing tools.
            </p>
            <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md">
              Upgrade Now
            </Button>
          </div>
        )}
      </div>
      </div>
    </>
  )
}
