"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Percent,
  Tag,
  Clock,
  Copy,
  Check,
  Gift,
  ChevronRight,
  Home,
  Truck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as promotionsApi from "@/lib/api/promotions";
import { minorToRupees } from "@/lib/api/config";
import type { CouponDto } from "@/lib/api/types";

const formatDate = (s?: string | null) => {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const couponHeadline = (c: CouponDto) => {
  if (c.type === "percentage" && c.percentBps) {
    return `${(c.percentBps / 100).toFixed(0)}%`;
  }
  if (c.type === "fixed_amount" && c.valueMinor) {
    return `₹${minorToRupees(c.valueMinor).toLocaleString()}`;
  }
  if (c.type === "free_shipping") return "FREE";
  if (c.type === "bogo") return "BOGO";
  return "DEAL";
};

const couponLabel = (c: CouponDto) => {
  if (c.type === "free_shipping") return "Free Shipping";
  if (c.type === "bogo") return "Buy 1 Get 1";
  if (c.type === "percentage") return "% Off";
  if (c.type === "fixed_amount") return "₹ Off";
  return "Deal";
};

const couponSubline = (c: CouponDto) => {
  const bits: string[] = [];
  if (c.minOrderMinor) {
    bits.push(`Min ₹${minorToRupees(c.minOrderMinor).toLocaleString()}`);
  }
  if (c.maxDiscountMinor) {
    bits.push(`Max ₹${minorToRupees(c.maxDiscountMinor).toLocaleString()}`);
  }
  if (c.endsAt) bits.push(`Till ${formatDate(c.endsAt)}`);
  return bits.join(" · ");
};

export default function OffersClient() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const list = await promotionsApi.publicCoupons(48);
        if (!cancelled) setCoupons(list);
      } catch (e) {
        console.error("Failed to load offers:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: "Coupon code copied!", description: code });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const flashOffers = coupons.filter((c) => c.type === "percentage").slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#F38508]">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Offers & Deals</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Offers & Deals
          </h1>
          <p className="text-gray-600">
            Apply these codes at checkout to save big.
          </p>
        </div>

        <Tabs defaultValue="coupons" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="coupons" className="gap-2">
              <Tag className="w-4 h-4" /> All Coupons ({coupons.length})
            </TabsTrigger>
            <TabsTrigger value="flash" className="gap-2">
              <Percent className="w-4 h-4" /> % Off ({flashOffers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coupons">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : coupons.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700">
                    No coupons available right now
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Check back later for new deals.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map((c) => (
                  <CouponCard
                    key={c.id}
                    coupon={c}
                    copied={copiedCode === c.code}
                    onCopy={() => copyCode(c.code)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="flash">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : flashOffers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500 text-sm">
                  No percentage-off coupons live right now.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flashOffers.map((c) => (
                  <CouponCard
                    key={c.id}
                    coupon={c}
                    copied={copiedCode === c.code}
                    onCopy={() => copyCode(c.code)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="mt-12 bg-gradient-to-r from-purple-600 to-pink-500 text-white overflow-hidden">
          <CardContent className="py-8 px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Gift className="w-12 h-12" />
              <div>
                <h3 className="text-xl font-bold">Refer & Earn</h3>
                <p className="text-purple-100">
                  Invite friends and earn rewards on their first order!
                </p>
              </div>
            </div>
            <Link href="/account/referral">
              <Button className="bg-white text-purple-600 hover:bg-purple-50 font-bold">
                Start Referring →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CouponCard({
  coupon,
  copied,
  onCopy,
}: {
  coupon: CouponDto;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0 flex">
        <div className="w-28 flex-shrink-0 bg-gradient-to-b from-[#F38508] to-[#D97706] flex flex-col items-center justify-center text-white p-4 text-center">
          {coupon.type === "free_shipping" ? (
            <Truck className="w-7 h-7 mb-1" />
          ) : (
            <Percent className="w-6 h-6 mb-1" />
          )}
          <span className="text-2xl font-bold leading-none">
            {couponHeadline(coupon)}
          </span>
          <span className="text-[10px] uppercase font-semibold mt-1">
            {couponLabel(coupon)}
          </span>
        </div>
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono font-bold text-lg">{coupon.code}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
              className={copied ? "bg-green-50 border-green-500" : ""}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-green-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" /> Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {couponSubline(coupon) || "Valid while live"}
          </p>
          {coupon.usageLimit ? (
            <p className="text-[11px] text-gray-400">
              Used {coupon.usageCount}/{coupon.usageLimit}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
