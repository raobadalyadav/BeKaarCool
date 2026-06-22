"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Facebook, Twitter, Instagram, Youtube,
  Mail, Phone, MapPin, Send, Smartphone, Play,
  ExternalLink,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Logo, VisaIcon, MastercardIcon, UpiIcon, RazorpayIcon, CodIcon } from "@/components/layout/logo"
import { newsletterSubscribe } from "@/lib/api/content"
import { listCategories } from "@/lib/api/products"
import type { CategoryDto } from "@/lib/api/types"

const SUPPORT_LINKS = [
  { label: "Track Your Order", href: "/track-order" },
  { label: "Returns & Exchanges", href: "/returns" },
  { label: "Shipping Info", href: "/shipping" },
  { label: "Size Guide", href: "/size-guide" },
  { label: "FAQs", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
  { label: "Bulk & Corporate", href: "/corporate" },
]

const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Press", href: "/press" },
  { label: "Collections", href: "/collections" },
  { label: "Affiliate Program", href: "/affiliate" },
]

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Sitemap", href: "/sitemap" },
  { label: "Cookie Policy", href: "/cookies" },
]

const SOCIALS = [
  { href: "https://facebook.com/baefikra", Icon: Facebook, label: "Facebook" },
  { href: "https://twitter.com/baefikra", Icon: Twitter, label: "Twitter" },
  { href: "https://instagram.com/baefikra", Icon: Instagram, label: "Instagram" },
  { href: "https://youtube.com/@baefikra", Icon: Youtube, label: "YouTube" },
]

export function Footer() {
  const [email, setEmail] = useState("")
  const [subscribing, setSubscribing] = useState(false)
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const { toast } = useToast()

  /* Fetch categories from backend for the Shop column */
  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => undefined)
  }, [])

  const shopLinks = categories.length > 0
    ? [
        ...categories.filter((c) => !c.parentId).slice(0, 7).map((c) => ({
          label: c.name,
          href: `/products?category=${encodeURIComponent(c.name)}`,
        })),
        { label: "New Arrivals", href: "/products?sort=newest" },
        { label: "Sale", href: "/products?sale=true" },
      ]
    : [
        { label: "Men's Fashion", href: "/products?category=Men" },
        { label: "Women's Fashion", href: "/products?category=Women" },
        { label: "Accessories", href: "/products?category=Accessories" },
        { label: "Footwear", href: "/products?category=Footwear" },
        { label: "Mobile Covers", href: "/products?category=Mobile%20Covers" },
        { label: "New Arrivals", href: "/products?sort=newest" },
        { label: "Sale", href: "/products?sale=true" },
      ]

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribing(true)
    try {
      await newsletterSubscribe(email.trim())
      toast({ title: "Subscribed!", description: "You'll get 10% off on your first order." })
      setEmail("")
    } catch {
      toast({ title: "Could not subscribe", description: "Please try again.", variant: "destructive" })
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <footer className="bg-charcoal-900 text-white">

      {/* Newsletter strip */}
      <div className="bg-charcoal-950 border-b border-charcoal-800">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white text-lg">Subscribe & get 10% off your first order</p>
              <p className="text-gray-400 text-sm mt-0.5">No spam. Unsubscribe any time.</p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 w-full md:w-auto md:min-w-[360px]">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-400 flex-1"
              />
              <Button
                type="submit"
                disabled={subscribing}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-5 flex-shrink-0"
              >
                {subscribing
                  ? <span className="text-xs">Subscribing…</span>
                  : <><Send className="h-4 w-4 mr-1.5" /> Subscribe</>
                }
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="container py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">

          {/* Col 1 — Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Logo width={140} height={35} textColor="#FFFFFF" />
            <p className="text-gray-400 text-sm leading-relaxed">
              India's favourite online fashion store. Trendy t-shirts, hoodies, accessories &amp; more at amazing prices.
            </p>
            <a href="mailto:support@baefikra.com" className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand-500 transition-colors">
              <Mail className="h-4 w-4 text-brand-500 flex-shrink-0" />
              support@baefikra.com
            </a>
            <a href="tel:+919876543210" className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand-500 transition-colors">
              <Phone className="h-4 w-4 text-brand-500 flex-shrink-0" />
              +91 98765 43210
            </a>
            <div className="flex items-start gap-2 text-sm text-gray-400">
              <MapPin className="h-4 w-4 text-brand-500 flex-shrink-0 mt-0.5" />
              <span>Mumbai, Maharashtra, India</span>
            </div>
            {/* Social links */}
            <div className="flex gap-2 pt-1">
              {SOCIALS.map(({ href, Icon, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 bg-charcoal-800 rounded-full flex items-center justify-center hover:bg-brand-500 hover:text-charcoal-900 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Shop (dynamic from backend) */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Shop</h3>
            <ul className="space-y-2.5">
              {shopLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-gray-400 text-sm hover:text-brand-500 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Company */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Company</h3>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-gray-400 text-sm hover:text-brand-500 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Support */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Support</h3>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-gray-400 text-sm hover:text-brand-500 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 5 — Get the App */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Get the App</h3>
            <p className="text-gray-400 text-sm">Shop on the go — exclusive app-only deals every day.</p>
            <div className="space-y-2">
              <Link
                href="/apps"
                className="flex items-center gap-3 bg-charcoal-800 hover:bg-charcoal-700 rounded-xl px-4 py-3 transition-colors group"
              >
                <Smartphone className="w-6 h-6 text-brand-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400">Download on the</p>
                  <p className="text-sm font-bold text-white group-hover:text-brand-400">App Store</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-600 ml-auto" />
              </Link>
              <Link
                href="/apps"
                className="flex items-center gap-3 bg-charcoal-800 hover:bg-charcoal-700 rounded-xl px-4 py-3 transition-colors group"
              >
                <Play className="w-6 h-6 text-brand-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400">Get it on</p>
                  <p className="text-sm font-bold text-white group-hover:text-brand-400">Google Play</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-600 ml-auto" />
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Legal links */}
      <div className="border-t border-charcoal-800">
        <div className="container py-3">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            {LEGAL_LINKS.map(({ label, href }) => (
              <Link key={href} href={href} className="hover:text-brand-500 transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-charcoal-800 bg-black/40">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} Baefikra. All rights reserved. Made with ❤️ in India.
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="text-gray-600 text-xs">We accept:</span>
              <div className="flex items-center gap-1.5">
                <VisaIcon />
                <MastercardIcon />
                <UpiIcon />
                <RazorpayIcon />
                <CodIcon />
              </div>
            </div>
          </div>
        </div>
      </div>

    </footer>
  )
}
