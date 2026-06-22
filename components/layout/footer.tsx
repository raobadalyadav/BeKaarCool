"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Send,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Logo, VisaIcon, MastercardIcon, UpiIcon, RazorpayIcon, CodIcon } from "@/components/layout/logo"

async function subscribeNewsletter(email: string): Promise<void> {
  const res = await fetch("/bff/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation { newsletterSubscribe(email: ${JSON.stringify(email)}) }`,
    }),
  })
  if (!res.ok) throw new Error("Network error")
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
}

export function Footer() {
  const [email, setEmail] = useState("")
  const [subscribing, setSubscribing] = useState(false)
  const { toast } = useToast()

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribing(true)
    try {
      await subscribeNewsletter(email.trim())
      toast({ title: "Subscribed!", description: "You'll get 10% off on your first order." })
      setEmail("")
    } catch {
      toast({ title: "Error", description: "Could not subscribe. Please try again.", variant: "destructive" })
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <footer className="bg-gray-900 text-white">

      {/* ── Newsletter strip ───────────────────────────────────── */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
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
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 flex-1"
              />
              <Button
                type="submit"
                disabled={subscribing}
                className="bg-[#F38508] hover:bg-[#D97706] text-black font-bold px-5 flex-shrink-0"
              >
                {subscribing ? "..." : <><Send className="h-4 w-4 mr-1" /> Subscribe</>}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Main footer grid ───────────────────────────────────── */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">

          {/* Col 1 — Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Logo width={140} height={35} textColor="#FFFFFF" />
            <p className="text-gray-400 text-sm leading-relaxed">
              India's favourite online fashion store. Trendy t-shirts, hoodies, accessories &amp; more at amazing prices.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Mail className="h-4 w-4 text-[#F38508] flex-shrink-0" />
              <span>support@baefikra.com</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Phone className="h-4 w-4 text-[#F38508] flex-shrink-0" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="h-4 w-4 text-[#F38508] flex-shrink-0" />
              <span>Mumbai, Maharashtra, India</span>
            </div>
            {/* Socials */}
            <div className="flex gap-2 pt-1">
              {[
                { href: "https://facebook.com", Icon: Facebook },
                { href: "https://twitter.com", Icon: Twitter },
                { href: "https://instagram.com", Icon: Instagram },
                { href: "https://youtube.com", Icon: Youtube },
              ].map(({ href, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  suppressHydrationWarning
                  className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#F38508] hover:text-black transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Shop */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Shop</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Men's Fashion", href: "/products?category=Men" },
                { label: "Women's Fashion", href: "/products?category=Women" },
                { label: "Accessories", href: "/products?category=Accessories" },
                { label: "Footwear", href: "/products?category=Footwear" },
                { label: "Mobile Covers", href: "/products?category=Mobile%20Covers" },
                { label: "Trending Now", href: "/products?sort=trending" },
                { label: "New Arrivals", href: "/products?sort=newest" },
                { label: "Sale", href: "/products?sale=true" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link suppressHydrationWarning href={href} className="text-gray-400 text-sm hover:text-[#F38508] transition-colors">
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
              {[
                { label: "About Us", href: "/about" },
                { label: "Blog", href: "/blog" },
                { label: "Careers", href: "/careers" },
                { label: "Press", href: "/press" },
                { label: "Collections", href: "/collections" },
                { label: "Affiliate Program", href: "/affiliate" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link suppressHydrationWarning href={href} className="text-gray-400 text-sm hover:text-[#F38508] transition-colors">
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
              {[
                { label: "Track Your Order", href: "/track-order" },
                { label: "Returns & Exchanges", href: "/returns" },
                { label: "Shipping Info", href: "/shipping" },
                { label: "Size Guide", href: "/size-guide" },
                { label: "FAQs", href: "/faq" },
                { label: "Contact Us", href: "/contact" },
                { label: "Bulk & Corporate", href: "/corporate" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link suppressHydrationWarning href={href} className="text-gray-400 text-sm hover:text-[#F38508] transition-colors">
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
                suppressHydrationWarning
                href="/apps"
                className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-3 transition-colors"
              >
                <span className="text-2xl">🍎</span>
                <div>
                  <p className="text-[10px] text-gray-400">Download on the</p>
                  <p className="text-sm font-bold text-white">App Store</p>
                </div>
              </Link>
              <Link
                suppressHydrationWarning
                href="/apps"
                className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-3 transition-colors"
              >
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="text-[10px] text-gray-400">Get it on</p>
                  <p className="text-sm font-bold text-white">Google Play</p>
                </div>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* ── Legal strip ────────────────────────────────────────── */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            {[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Sitemap", href: "/sitemap" },
              { label: "Cookie Policy", href: "/cookies" },
            ].map(({ label, href }) => (
              <Link key={href} suppressHydrationWarning href={href} className="hover:text-[#F38508] transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────── */}
      <div className="border-t border-gray-800 bg-black/40">
        <div className="container mx-auto px-4 py-4">
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
