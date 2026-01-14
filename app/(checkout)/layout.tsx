import Link from "next/link"
import { ShieldCheck } from "lucide-react"

export default function CheckoutLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex-shrink-0">
                        <span className="font-bold text-2xl tracking-tight text-yellow-500">
                            BeKaarCool
                        </span>
                    </Link>
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wide">100% Secure Payment</span>
                    </div>
                </div>
            </header>
            <main>
                {children}
            </main>
        </div>
    )
}
