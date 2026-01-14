"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  LogOut,
  HelpCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigationGroups = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/seller", icon: LayoutDashboard },
      { name: "Analytics", href: "/seller/analytics", icon: BarChart3 },
    ]
  },
  {
    title: "Business",
    items: [
      { name: "Orders", href: "/seller/orders", icon: ShoppingCart, badge: "3" },
      { name: "Products", href: "/seller/products", icon: Package },
      { name: "Customers", href: "/seller/customers", icon: Users },
    ]
  },
  {
    title: "Growth",
    items: [
      { name: "Marketing", href: "/seller/marketing", icon: TrendingUp },
      { name: "Revenue", href: "/seller/revenue", icon: DollarSign },
      { name: "Designs", href: "/seller/designs", icon: Palette },
    ]
  },
  {
    title: "Communication",
    items: [
      { name: "Messages", href: "/seller/messages", icon: MessageSquare, badge: "2" },
      { name: "Reports", href: "/seller/reports", icon: FileText },
    ]
  }
]

const bottomNav = [
  { name: "Settings", href: "/seller/settings", icon: Settings },
  { name: "Help Center", href: "/seller/help", icon: HelpCircle },
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => onOpenChange?.(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full flex flex-col bg-white border-r border-gray-100 shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out",
          "lg:relative lg:translate-x-0",
          collapsed ? "w-20" : "w-72",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 bg-white">
          {!collapsed && (
            <div className="flex items-center space-x-3 transition-opacity duration-300">
              <div className="h-8 w-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-blue-200 shadow-lg">
                <Store className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg tracking-tight">BeKaarCool</h2>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Seller Central</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation Scroll Area */}
        <ScrollArea className="flex-1 py-4">
          <div className="space-y-6 px-3">
            {navigationGroups.map((group, idx) => (
              <div key={group.title}>
                {!collapsed && (
                  <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link key={item.name} href={item.href}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start relative h-10 mb-1 font-medium transition-all duration-200",
                            collapsed ? "px-0 justify-center" : "px-3",
                            isActive
                              ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                          )}
                        >
                          {isActive && !collapsed && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
                          )}

                          <item.icon
                            className={cn(
                              "h-[18px] w-[18px] transition-colors",
                              isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-900",
                              collapsed ? "" : "mr-3"
                            )}
                          />

                          {!collapsed && (
                            <>
                              <span className="flex-1 text-left truncate">{item.name}</span>
                              {item.badge && (
                                <Badge
                                  className={cn(
                                    "ml-auto h-5 px-1.5 min-w-[1.25rem] flex items-center justify-center text-[10px]",
                                    isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 border-gray-200"
                                  )}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50 space-y-2">
          {!collapsed && (
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 shadow-lg mb-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-all" />

              <div className="relative z-10 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <h4 className="font-bold text-sm">Pro Seller</h4>
                </div>
                <p className="text-[11px] text-indigo-100 mb-3 leading-snug">
                  Get 2x more visibility & analytics with Pro.
                </p>
                <Button size="sm" variant="secondary" className="w-full h-8 text-xs font-semibold bg-white text-indigo-600 hover:bg-indigo-50 border-0">
                  Upgrade Now
                </Button>
              </div>
            </div>
          )}

          {bottomNav.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-9 text-gray-500 hover:text-gray-900",
                  collapsed ? "px-0 justify-center" : "px-3"
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px]", collapsed ? "" : "mr-3")} />
                {!collapsed && <span>{item.name}</span>}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
