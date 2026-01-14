import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Home, ChevronRight, Download, Mail, Calendar, ExternalLink
} from "lucide-react"

export const metadata: Metadata = {
    title: "Press & Media - BeKaarCool",
    description: "Press releases, media coverage, and brand assets for BeKaarCool."
}

const pressReleases = [
    {
        title: "BeKaarCool Raises Series B Funding of $50M",
        date: "2026-01-10",
        summary: "Leading the next wave of fashion e-commerce in India with expansion plans.",
        link: "#"
    },
    {
        title: "BeKaarCool Launches Sustainable Fashion Line",
        date: "2025-11-15",
        summary: "100% recycled materials used in new eco-friendly collection.",
        link: "#"
    },
    {
        title: "BeKaarCool Partners with Top Designers",
        date: "2025-09-20",
        summary: "Exclusive collaborations bringing high fashion to affordable prices.",
        link: "#"
    }
]

const mediaItems = [
    { outlet: "Economic Times", title: "The Rise of BeKaarCool", date: "Dec 2025" },
    { outlet: "Vogue India", title: "Brands Redefining Fast Fashion", date: "Nov 2025" },
    { outlet: "Business Standard", title: "E-commerce Success Stories", date: "Oct 2025" }
]

export default function PressPage() {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        })
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumbs */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-3">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-yellow-600">
                            <Home className="w-4 h-4" />
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">Press & Media</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Press & Media</h1>
                    <p className="text-gray-600">The latest news and updates from BeKaarCool</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Press Releases */}
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-bold mb-6">Press Releases</h2>
                        <div className="space-y-4">
                            {pressReleases.map(pr => (
                                <Card key={pr.title} className="hover:shadow-lg transition-shadow">
                                    <CardContent className="py-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <span className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                                                    <Calendar className="w-4 h-4" /> {formatDate(pr.date)}
                                                </span>
                                                <h3 className="font-semibold text-lg">{pr.title}</h3>
                                                <p className="text-gray-600 text-sm mt-1">{pr.summary}</p>
                                            </div>
                                            <Link href={pr.link}>
                                                <Button variant="outline" size="sm">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Media Coverage */}
                        <Card>
                            <CardContent className="py-4">
                                <h3 className="font-bold mb-4">Media Coverage</h3>
                                <div className="space-y-3">
                                    {mediaItems.map(item => (
                                        <div key={item.title} className="border-b pb-3 last:border-0">
                                            <p className="text-sm text-yellow-600 font-semibold">{item.outlet}</p>
                                            <p className="text-gray-800">{item.title}</p>
                                            <p className="text-xs text-gray-500">{item.date}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Brand Assets */}
                        <Card>
                            <CardContent className="py-4">
                                <h3 className="font-bold mb-4">Brand Assets</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Download official logos, brand guidelines, and media kit.
                                </p>
                                <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
                                    <Download className="w-4 h-4 mr-2" /> Download Media Kit
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Contact */}
                        <Card className="bg-gray-900 text-white">
                            <CardContent className="py-4">
                                <h3 className="font-bold mb-2">Media Contact</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    For press inquiries and interview requests:
                                </p>
                                <a
                                    href="mailto:press@bekaarcool.com"
                                    className="flex items-center gap-2 text-yellow-400 hover:underline"
                                >
                                    <Mail className="w-4 h-4" /> press@bekaarcool.com
                                </a>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
