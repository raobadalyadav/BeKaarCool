"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CreditCard } from "lucide-react"

export default function PaymentsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
            <Card>
                <CardContent className="py-12 text-center">
                    <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700">No saved payment methods</h3>
                    <p className="text-gray-500 mt-2">Your saved cards and UPI IDs will appear here</p>
                </CardContent>
            </Card>
        </div>
    )
}
