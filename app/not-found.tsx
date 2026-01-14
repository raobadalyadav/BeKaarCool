"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search, ArrowLeft, ShoppingBag } from "lucide-react"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
            <div className="text-center max-w-lg">
                {/* 404 Illustration */}
                <div className="relative mb-8">
                    <h1 className="text-[180px] font-black text-gray-100 leading-none select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-yellow-400 rounded-full p-6 shadow-lg transform -rotate-12">
                            <Search className="w-12 h-12 text-black" />
                        </div>
                    </div>
                </div>

                {/* Message */}
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Page Not Found
                </h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Oops! The page you&apos;re looking for seems to have wandered off.
                    It might have been moved, deleted, or never existed.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        asChild
                        className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                    >
                        <Link href="/">
                            <Home className="w-4 h-4 mr-2" />
                            Go Home
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="border-gray-300"
                    >
                        <Link href="/products">
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Browse Products
                        </Link>
                    </Button>
                </div>

                {/* Back Link */}
                <button
                    onClick={() => window.history.back()}
                    className="mt-8 text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go back to previous page
                </button>
            </div>
        </div>
    )
}
