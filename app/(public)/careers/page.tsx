import { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Home, ChevronRight, Briefcase, MapPin, Clock, Users,
    Heart, Zap, Coffee, Rocket
} from "lucide-react"

export const metadata: Metadata = {
    title: "Careers - BeKaarCool",
    description: "Join our team at BeKaarCool. Explore exciting career opportunities in fashion, tech, and more."
}

const openPositions = [
    {
        title: "Senior Full Stack Developer",
        department: "Engineering",
        location: "Remote / Bangalore",
        type: "Full-time",
    },
    {
        title: "UI/UX Designer",
        department: "Design",
        location: "Remote",
        type: "Full-time",
    },
    {
        title: "Fashion Stylist",
        department: "Creative",
        location: "Mumbai",
        type: "Full-time",
    },
    {
        title: "Digital Marketing Manager",
        department: "Marketing",
        location: "Remote / Delhi",
        type: "Full-time",
    },
    {
        title: "Customer Experience Lead",
        department: "Operations",
        location: "Bangalore",
        type: "Full-time",
    }
]

const perks = [
    { icon: Heart, title: "Health Insurance", desc: "Comprehensive health coverage" },
    { icon: Zap, title: "Fast Growth", desc: "Rapid career advancement" },
    { icon: Coffee, title: "Flexible Work", desc: "Work from home options" },
    { icon: Rocket, title: "Learning", desc: "Continuous skill development" }
]

export default function CareersPage() {
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
                        <span className="text-gray-900 font-medium">Careers</span>
                    </nav>
                </div>
            </div>

            {/* Hero */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
                    <p className="text-lg opacity-90 max-w-2xl mx-auto">
                        Be part of India's fastest-growing fashion brand. We're looking for passionate
                        individuals who want to make a difference.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    <Card>
                        <CardContent className="py-6 text-center">
                            <p className="text-3xl font-bold text-yellow-600">500+</p>
                            <p className="text-gray-600">Team Members</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-6 text-center">
                            <p className="text-3xl font-bold text-yellow-600">5</p>
                            <p className="text-gray-600">Office Locations</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-6 text-center">
                            <p className="text-3xl font-bold text-yellow-600">50%</p>
                            <p className="text-gray-600">Remote Team</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-6 text-center">
                            <p className="text-3xl font-bold text-yellow-600">4.5★</p>
                            <p className="text-gray-600">Glassdoor Rating</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Why Join Us */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-center mb-8">Why Join BeKaarCool?</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {perks.map(perk => (
                            <Card key={perk.title}>
                                <CardContent className="py-6 text-center">
                                    <perk.icon className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                                    <h3 className="font-semibold">{perk.title}</h3>
                                    <p className="text-sm text-gray-500">{perk.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Open Positions */}
                <div>
                    <h2 className="text-2xl font-bold text-center mb-8">Open Positions</h2>
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {openPositions.map(job => (
                            <Card key={job.title} className="hover:shadow-lg transition-shadow">
                                <CardContent className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">{job.title}</h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="w-4 h-4" /> {job.department}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" /> {job.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" /> {job.type}
                                            </span>
                                        </div>
                                    </div>
                                    <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
                                        Apply Now
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <Card className="mt-12 bg-gray-900 text-white">
                    <CardContent className="py-8 text-center">
                        <Users className="w-12 h-12 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Don't see a role that fits?</h3>
                        <p className="text-gray-400 mb-4">
                            We're always looking for talented people. Send us your resume!
                        </p>
                        <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
                            Send Your Resume
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
