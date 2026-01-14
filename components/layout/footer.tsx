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
  Shield,
  Truck,
  Award,
  CreditCard,
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
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        toast({
          title: "Subscribed!",
          description: "Thank you for subscribing to our newsletter.",
        })
        setEmail("")
      } else {
        throw new Error("Failed to subscribe")
      }
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
    { icon: CreditCard, text: "Secure Payments" },
    { icon: Truck, text: "Fast Delivery" },
    { icon: Shield, text: "100% Genuine" },
    { icon: Award, text: "Best Quality" },
  ]

  return (
    <footer className="bg-gray-900 text-white">
      {/* Features Bar */}
      <div className="bg-yellow-400 py-4">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center justify-center space-x-2 text-black">
                <feature.icon className="h-5 w-5" />
                <span className="font-semibold text-sm">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-lg">B</span>
              </div>
              <span className="font-bold text-2xl text-yellow-400">
                BeKaarCool
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              India's favourite online fashion store. Explore trendy t-shirts, hoodies, accessories and more at amazing prices. Shop the coolest styles with confidence!
            </p>

            {/* Social Links */}
            <div className="flex space-x-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-black transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-black transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-black transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-black transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-white uppercase tracking-wide">Shop</h3>
            <div className="space-y-3">
              <Link href="/products?category=Men" className="block text-gray-400 hover:text-yellow-400 transition-colors">
                Men's Fashion
              </Link>
              <Link href="/products?category=Women" className="block text-gray-400 hover:text-yellow-400 transition-colors">
                Women's Fashion
              </Link>
              <Link href="/products?category=Accessories" className="block text-gray-400 hover:text-yellow-400 transition-colors">
                Accessories
              </Link>
              <Link href="/products?category=Footwear" className="block text-gray-400 hover:text-yellow-400 transition-colors">
                Footwear
              </Link>
              <Link href="/products?featured=true" className="block text-gray-400 hover:text-yellow-400 transition-colors">
                Featured Products
              </Link>
              <Link href="/products?sort=trending" className="block text-gray-400 hover:text-yellow-400 transition-colors">
                Trending Now
              </Link>
            </div>
          </div>

          {/* Help */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-white uppercase tracking-wide">Help</h3>
            <div className="space-y-3">
              <Link href="/track-order" className="block text-gray-400 hover:text-yellow-400 transition-colors">
                Track Your Order
              </Link>
              <Link href="/shipping" className="block text-gray-400 hover:text-yellow-400 transition-colors">
                Shipping Information
              </Link>
              <Link href="/returns" className="block text-gray-400 hover:text-yellow-400 transition-colors">
                Returns & Exchanges
              </Link>
              <Link href="/size-guide" className="block text-gray-400 hover:text-yellow-400 transition-colors">
                Size Guide
              </Link>
              <Link href="/faq" className="block text-gray-400 hover:text-yellow-400 transition-colors">
                FAQs
              </Link>
              <Link href="/contact" className="block text-gray-400 hover:text-yellow-400 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-white uppercase tracking-wide">Contact</h3>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-400">
                <Mail className="h-5 w-5 text-yellow-400" />
                <span className="text-sm">support@bekaarcool.com</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <Phone className="h-5 w-5 text-yellow-400" />
                <span className="text-sm">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <MapPin className="h-5 w-5 text-yellow-400" />
                <span className="text-sm">Mumbai, Maharashtra, India</span>
              </div>
            </div>

            {/* Newsletter */}
            <div className="space-y-3">
              <p className="font-semibold text-white">Newsletter</p>
              <p className="text-sm text-gray-400">Get 10% off on your first order!</p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 flex-1"
                  required
                />
                <Button
                  type="submit"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4"
                  disabled={subscribing}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Links */}
      <div className="border-t border-gray-800">
        <div className="container py-4">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <Link href="/about" className="hover:text-yellow-400 transition-colors">About Us</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-yellow-400 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-yellow-400 transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link href="/seller/register" className="hover:text-yellow-400 transition-colors">Become a Seller</Link>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-800 bg-black/30">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-gray-500 text-sm">
              <p>© 2024 BeKaarCool. All rights reserved.</p>
              <span className="hidden md:inline">|</span>
              <div className="hidden md:flex items-center space-x-1">
                <span>Made with</span>
                <Heart className="h-4 w-4 text-red-500 fill-current" />
                <span>in India</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex items-center space-x-3">
              <span className="text-gray-500 text-sm">We accept:</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs border-gray-700 text-gray-400 bg-gray-800">
                  Visa
                </Badge>
                <Badge variant="outline" className="text-xs border-gray-700 text-gray-400 bg-gray-800">
                  Mastercard
                </Badge>
                <Badge variant="outline" className="text-xs border-gray-700 text-gray-400 bg-gray-800">
                  UPI
                </Badge>
                <Badge variant="outline" className="text-xs border-gray-700 text-gray-400 bg-gray-800">
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