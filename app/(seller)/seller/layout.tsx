"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { SellerSidebar } from "@/components/seller/seller-sidebar"
import { SellerHeader } from "@/components/seller/seller-header"
import { Loader2 } from "lucide-react"

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    if (!session || (session.user.role !== "seller" && session.user.role !== "admin")) {
      router.push("/auth/login")
      return
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session || (session.user.role !== "seller" && session.user.role !== "admin")) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      <SellerSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <SellerHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="">{children}</main>
      </div>
    </div>
  )
}
