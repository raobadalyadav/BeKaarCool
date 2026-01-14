"use client"

import Link from "next/link"
import { Package, CreditCard, Wallet, MapPin, Settings, HelpCircle } from "lucide-react"

// Quick Action Card Component
function QuickActionCard({
    icon: Icon,
    title,
    description,
    href
}: {
    icon: any
    title: string
    description: string
    href: string
}) {
    return (
        <Link
            href={href}
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md hover:border-yellow-300 text-left transition-all group block"
        >
            <Icon className="w-8 h-8 text-yellow-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
        </Link>
    )
}

export default function AccountOverviewPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">My Account</h1>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuickActionCard
                    icon={Package}
                    title="My Orders"
                    description="View, modify and track orders"
                    href="/account/orders"
                />
                <QuickActionCard
                    icon={CreditCard}
                    title="My Payments"
                    description="View and modify payment methods"
                    href="/account/payments"
                />
                <QuickActionCard
                    icon={Wallet}
                    title="My Wallet"
                    description="Wallet history and gift cards"
                    href="/account/wallet"
                />
                <QuickActionCard
                    icon={MapPin}
                    title="My Addresses"
                    description="Edit, add or remove addresses"
                    href="/account/addresses"
                />
                <QuickActionCard
                    icon={Settings}
                    title="My Profile"
                    description="Edit personal info and password"
                    href="/account/profile"
                />
                <QuickActionCard
                    icon={HelpCircle}
                    title="Help & Support"
                    description="Reach out to us"
                    href="/contact"
                />
            </div>
        </div>
    )
}
