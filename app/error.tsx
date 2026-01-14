"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, RefreshCw, AlertTriangle } from "lucide-react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Application error:", error)
    }, [error])

    return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
            <div className="text-center max-w-lg">
                {/* Error Illustration */}
                <div className="relative mb-8">
                    <h1 className="text-[180px] font-black text-red-100 leading-none select-none">
                        500
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-500 rounded-full p-6 shadow-lg">
                            <AlertTriangle className="w-12 h-12 text-white" />
                        </div>
                    </div>
                </div>

                {/* Message */}
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Something Went Wrong
                </h2>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    We&apos;re sorry, but something unexpected happened. Our team has been
                    notified and we&apos;re working to fix it.
                </p>

                {/* Error Details (Dev Only) */}
                {process.env.NODE_ENV === "development" && error.message && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                        <p className="text-xs font-mono text-red-600 break-all">
                            {error.message}
                        </p>
                        {error.digest && (
                            <p className="text-xs text-red-400 mt-2">
                                Error ID: {error.digest}
                            </p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={reset}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="border-gray-300"
                    >
                        <Link href="/">
                            <Home className="w-4 h-4 mr-2" />
                            Go Home
                        </Link>
                    </Button>
                </div>

                {/* Support Link */}
                <p className="mt-8 text-sm text-gray-500">
                    Need help?{" "}
                    <Link href="/contact" className="text-yellow-600 hover:text-yellow-700 underline">
                        Contact Support
                    </Link>
                </p>
            </div>
        </div>
    )
}
