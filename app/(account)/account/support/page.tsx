"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  RotateCcw,
  CreditCard,
  MessageCircle,
  Phone,
  Mail,
  HelpCircle,
  ChevronRight,
  Clock,
  MapPin,
  Truck,
  ShieldCheck,
} from "lucide-react";

const quickLinks = [
  {
    icon: Package,
    title: "Track an Order",
    description: "Check where your order is right now.",
    href: "/account/orders",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: RotateCcw,
    title: "Return or Exchange",
    description: "Start a return or request a size exchange.",
    href: "/account/orders",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: CreditCard,
    title: "Payment & Wallet",
    description: "View transactions and your wallet balance.",
    href: "/account/wallet",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: MapPin,
    title: "Manage Addresses",
    description: "Update your shipping and billing addresses.",
    href: "/account/addresses",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: ShieldCheck,
    title: "Account Security",
    description: "Sessions, password, and two-factor auth.",
    href: "/account/security",
    color: "bg-orange-50 text-[#F38508]",
  },
  {
    icon: Truck,
    title: "Shipping Policy",
    description: "Delivery timelines, zones, and charges.",
    href: "/shipping",
    color: "bg-pink-50 text-pink-600",
  },
];

const faqs = [
  {
    question: "How long does delivery take?",
    answer:
      "Standard delivery takes 3–7 business days. Express delivery (where available) arrives in 1–2 business days.",
  },
  {
    question: "Can I cancel my order?",
    answer:
      "You can cancel an order within 30 minutes of placing it. After that, the order enters processing and cancellation may not be possible.",
  },
  {
    question: "How do returns work?",
    answer:
      "We offer a 7-day return window from delivery. Items must be unworn, unwashed, with original tags. Initiate a return from your Orders page.",
  },
  {
    question: "When will my wallet credit be added?",
    answer:
      "Referral rewards are credited within 24 hours of your friend's first paid order. Refunds are credited within 3–5 business days.",
  },
  {
    question: "How do I apply a coupon?",
    answer:
      "Enter your coupon code in the cart before checkout. Only one coupon can be applied per order.",
  },
];

export default function SupportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-500 mt-1">Find quick answers or reach our team.</p>
      </div>

      {/* Quick Links */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#F38508]" /> What do you need help with?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href + link.title} href={link.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${link.color}`}
                  >
                    <link.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{link.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{link.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-auto mt-1" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Separator />

      {/* FAQ */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-gray-400" /> Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <Card key={faq.question}>
              <CardContent className="p-5">
                <p className="font-semibold text-sm text-gray-900">{faq.question}</p>
                <p className="text-sm text-gray-600 mt-2">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Contact Options */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-gray-400" /> Contact Our Team
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F38508]" /> Email
              </CardTitle>
              <CardDescription>We reply within 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">support@baefikra.com</p>
              <Link href="/contact">
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  Send a Message
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F38508]" /> Phone
              </CardTitle>
              <CardDescription>Mon–Sat, 10 AM–6 PM IST</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">+91 98765 43210</p>
              <a href="tel:+919876543210">
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  Call Now
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F38508]" /> Hours
              </CardTitle>
              <CardDescription>When we're available</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-1">
              <p>Mon – Fri: 9 AM – 6 PM</p>
              <p>Saturday: 10 AM – 4 PM</p>
              <p className="text-red-500">Sunday: Closed</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
