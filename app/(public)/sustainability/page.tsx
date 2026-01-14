import { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Leaf, Recycle, Heart, Truck, Factory, TreePine, Droplets, Sun,
    ChevronRight, Home
} from "lucide-react"

export const metadata: Metadata = {
    title: "Sustainability - BeKaarCool",
    description: "Our commitment to sustainable fashion and eco-friendly practices."
}

const initiatives = [
    {
        icon: Recycle,
        title: "Recycled Materials",
        description: "30% of our products use recycled fabrics and materials, reducing waste and environmental impact."
    },
    {
        icon: Droplets,
        title: "Water Conservation",
        description: "Our manufacturing partners use water-efficient dyeing processes, saving millions of liters annually."
    },
    {
        icon: Factory,
        title: "Ethical Manufacturing",
        description: "All our factories are certified for fair labor practices and safe working conditions."
    },
    {
        icon: Truck,
        title: "Green Shipping",
        description: "Carbon-neutral shipping options and consolidated packaging to reduce emissions."
    },
    {
        icon: TreePine,
        title: "Reforestation",
        description: "For every 100 orders, we plant a tree in partnership with environmental organizations."
    },
    {
        icon: Sun,
        title: "Solar Powered",
        description: "Our warehouses run on 100% renewable solar energy."
    }
]

const stats = [
    { value: "50%", label: "Carbon reduction by 2025" },
    { value: "1M+", label: "Trees planted" },
    { value: "30%", label: "Recycled materials used" },
    { value: "Zero", label: "Plastic in packaging by 2024" }
]

export default function SustainabilityPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
            {/* Breadcrumbs */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-3">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-green-600">
                            <Home className="w-4 h-4" />
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">Sustainability</span>
                    </nav>
                </div>
            </div>

            {/* Hero */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <Leaf className="w-16 h-16 mx-auto mb-4" />
                    <h1 className="text-4xl font-bold mb-4">Fashion for a Better Tomorrow</h1>
                    <p className="text-lg text-green-100 max-w-2xl mx-auto">
                        At BeKaarCool, we believe style shouldn't cost the Earth.
                        We're committed to sustainable practices that protect our planet.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                    {stats.map((stat, idx) => (
                        <Card key={idx} className="text-center">
                            <CardContent className="py-6">
                                <p className="text-3xl font-bold text-green-600">{stat.value}</p>
                                <p className="text-sm text-gray-600">{stat.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Initiatives */}
                <h2 className="text-2xl font-bold text-center mb-8">Our Green Initiatives</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {initiatives.map((item, idx) => (
                        <Card key={idx} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <item.icon className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                                <p className="text-gray-600 text-sm">{item.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Recycling Program */}
                <Card className="bg-green-600 text-white mb-16">
                    <CardContent className="py-12 text-center">
                        <Heart className="w-12 h-12 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-4">Clothing Recycling Program</h2>
                        <p className="text-green-100 max-w-xl mx-auto mb-6">
                            Send us your old clothes (any brand!) and get ₹200 off your next order.
                            We'll ensure they're recycled or donated responsibly.
                        </p>
                        <Button className="bg-white text-green-600 hover:bg-gray-100 font-bold">
                            Learn More
                        </Button>
                    </CardContent>
                </Card>

                {/* Commitment */}
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold mb-4">Our 2030 Commitment</h2>
                    <p className="text-gray-600 mb-6">
                        By 2030, we aim to achieve 100% sustainable materials in all products,
                        carbon-neutral operations, and zero waste to landfill. Join us on this journey
                        to make fashion a force for good.
                    </p>
                    <Link href="/products">
                        <Button className="bg-green-600 hover:bg-green-700 text-white font-bold">
                            Shop Sustainable Collection
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
