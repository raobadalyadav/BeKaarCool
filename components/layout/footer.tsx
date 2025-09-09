"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Send,
  Heart,
  Palette,
  Shield,
  Truck,
  Award,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function Footer() {
  const [email, setEmail] = useState("")
  const [subscribing, setSubscribing] = useState(false)
  const { toast } = useToast()

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setSubscribing(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      })
      setEmail("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubscribing(false)
    }
  }

  const features = [
    { icon: Palette, text: "Custom Design Tools" },
    { icon: Shield, text: "Secure Payments" },
    { icon: Truck, text: "Fast Shipping" },
    { icon: Award, text: "Quality Guarantee" },
  ]

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Top Section */}
      <div className="border-b border-gray-700">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <span className="font-bold text-2xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  BeKaarCool
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Transform your creativity into premium custom products. Design, print, and sell with our comprehensive
                e-commerce platform trusted by thousands of creators worldwide.
              </p>

              {/* Social Links */}
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
                  <Youtube className="h-5 w-5" />
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-400">
                    <feature.icon className="h-4 w-4 text-blue-400" />
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h3 className="font-semibold text-lg text-white">Quick Links</h3>
              <div className="space-y-3">
                <Link href="/products" className="block text-gray-300 hover:text-white transition-colors">
                  Browse Products
                </Link>
                <Link href="/design" className="block text-gray-300 hover:text-white transition-colors">
                  Design Studio
                </Link>
                <Link href="/about" className="block text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
                <Link href="/contact" className="block text-gray-300 hover:text-white transition-colors">
                  Contact Support
                </Link>
                <Link href="/track-order" className="block text-gray-300 hover:text-white transition-colors">
                  Track Order
                </Link>
                <Link href="/seller/register" className="block text-gray-300 hover:text-white transition-colors">
                  Become a Seller
                </Link>
              </div>
            </div>

            {/* Customer Service */}
            <div className="space-y-6">
              <h3 className="font-semibold text-lg text-white">Customer Service</h3>
              <div className="space-y-3">
                <Link href="/shipping" className="block text-gray-300 hover:text-white transition-colors">
                  Shipping Information
                </Link>
                <Link href="/returns" className="block text-gray-300 hover:text-white transition-colors">
                  Returns & Exchanges
                </Link>
                <Link href="/size-guide" className="block text-gray-300 hover:text-white transition-colors">
                  Size Guide
                </Link>
                <Link href="/privacy" className="block text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="block text-gray-300 hover:text-white transition-colors">
                  Terms of Service
                </Link>
                <Link href="/faq" className="block text-gray-300 hover:text-white transition-colors">
                  FAQ
                </Link>
              </div>
            </div>

            {/* Contact & Newsletter */}
            <div className="space-y-6">
              <h3 className="font-semibold text-lg text-white">Stay Connected</h3>

              {/* Contact Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-300">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm">support@bekaarcool.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Phone className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm">+91 12345 67890</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm">Mumbai, Maharashtra, India</p>
                  </div>
                </div>
              </div>

              {/* Newsletter */}
              <div className="space-y-3">
                <p className="font-medium text-white">Subscribe to our newsletter</p>
                <p className="text-sm text-gray-400">Get updates on new products and exclusive offers</p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={subscribing}
                  >
                    {subscribing ? (
                      "Subscribing..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Subscribe
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-700">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-4 text-gray-400 text-sm">
              <p>&copy; 2024 BeKaarCool. All rights reserved.</p>
              <div className="flex items-center space-x-1">
                <span>Made with</span>
                <Heart className="h-4 w-4 text-red-500 fill-current" />
                <span>in India</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">We accept:</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                  Razorpay
                </Badge>
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                  PhonePe
                </Badge>
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                  COD
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}