'use client';
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, AlertTriangle } from "lucide-react"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body>
                <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
                    <div className="text-center max-w-lg">
                        <div className="mb-8 flex justify-center">
                            <div className="bg-red-500 rounded-full p-8 shadow-lg">
                                <AlertTriangle className="w-16 h-16 text-white" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Critical Error
                        </h1>
                        <p className="text-gray-600 mb-8">
                            A critical error occurred. Please try refreshing the page or come back later.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={reset}
                                className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg inline-flex items-center justify-center"
                            >
                                Try Again
                            </button>
                            <a
                                href="/"
                                className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg inline-flex items-center justify-center"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Go Home
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    )
}
