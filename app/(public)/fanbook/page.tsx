import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Camera,
  Hash,
  Star,
  Heart,
  Share2,
  ShoppingBag,
  Instagram,
  MessageSquare,
  Users,
} from "lucide-react";

const steps = [
  {
    icon: ShoppingBag,
    step: "1",
    title: "Place an order",
    description: "Shop our oversized tees, hoodies, and accessories.",
    color: "bg-yellow-50 text-yellow-600 border-yellow-200",
  },
  {
    icon: Camera,
    step: "2",
    title: "Style & shoot",
    description: "Rock your look. Take a photo or reel showing off your vibe.",
    color: "bg-pink-50 text-pink-600 border-pink-200",
  },
  {
    icon: Hash,
    step: "3",
    title: "Tag us",
    description: "Post on Instagram and tag @baefikra with #BaefikraVibes.",
    color: "bg-purple-50 text-purple-600 border-purple-200",
  },
  {
    icon: Heart,
    step: "4",
    title: "Get featured",
    description: "The best looks get featured here and on our social pages.",
    color: "bg-red-50 text-red-600 border-red-200",
  },
];

const perks = [
  { icon: Star, title: "Earn rewards", description: "Get wallet credits for every review with a photo." },
  { icon: Users, title: "Join the community", description: "Connect with thousands of Baefikra fans." },
  { icon: Share2, title: "Share your story", description: "Inspire others with your unique style." },
  { icon: MessageSquare, title: "Leave a review", description: "Help shoppers make the right choice." },
];

export default function FanbookPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-yellow-400 via-yellow-300 to-orange-300 py-20 px-4 text-center">
        <Badge className="mb-4 bg-black text-yellow-400 text-xs font-bold tracking-widest uppercase border-0">
          Community
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-black mb-4 leading-tight">
          The Fanbook
        </h1>
        <p className="text-gray-800 text-lg max-w-xl mx-auto mb-8">
          Real people. Real fits. Show us how you wear Baefikra and get featured in the community hall of fame.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://instagram.com/baefikra"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-black text-white hover:bg-gray-900 gap-2 text-base px-6 py-5">
              <Instagram className="w-5 h-5" /> Follow @baefikra
            </Button>
          </a>
          <Link href="/account/orders">
            <Button variant="outline" className="bg-white/80 border-black text-black hover:bg-white gap-2 text-base px-6 py-5">
              <Star className="w-5 h-5" /> Leave a Review
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

        {/* How it works */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How to get featured</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <Card key={s.step} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="pt-8 pb-6 px-5">
                  <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center mx-auto mb-4 ${s.color}`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Step {s.step}
                  </div>
                  <p className="font-bold text-sm text-gray-900 mb-2">{s.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* Instagram embed CTA */}
        <section className="text-center">
          <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-2xl p-10 text-white">
            <Instagram className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl font-extrabold mb-2">#BaefikraVibes</h2>
            <p className="text-white/80 max-w-md mx-auto mb-6 text-sm">
              Join thousands of fans sharing their Baefikra fits. Tag your photos with{" "}
              <strong>#BaefikraVibes</strong> and <strong>@baefikra</strong> for a chance to be featured.
            </p>
            <a
              href="https://www.instagram.com/explore/tags/baefikravibes/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-white text-purple-700 font-bold hover:bg-purple-50 gap-2">
                <Hash className="w-4 h-4" /> View #BaefikraVibes on Instagram
              </Button>
            </a>
          </div>
        </section>

        <Separator />

        {/* Perks */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Why share your look?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {perks.map((p) => (
              <div key={p.title} className="flex items-start gap-4 p-5 bg-white border rounded-xl hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Review CTA */}
        <section className="bg-white border rounded-2xl p-8 text-center shadow-sm">
          <Star className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Bought something recently?</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Your review helps other shoppers make the right call — and earns you wallet credits. Every verified purchase review counts.
          </p>
          <Link href="/account/orders">
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold gap-2 px-8">
              <MessageSquare className="w-4 h-4" /> Write a Review
            </Button>
          </Link>
        </section>

      </div>
    </div>
  );
}
