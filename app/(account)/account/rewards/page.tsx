"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Wallet,
  Users,
  Gift,
  Star,
  Copy,
  Check,
  Share2,
  TrendingUp,
  ChevronRight,
  ShoppingBag,
  Percent,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as walletApi from "@/lib/api/wallet";
import * as referralsApi from "@/lib/api/referrals";
import { minorToRupees } from "@/lib/api/config";

const formatDate = (s: string) => {
  try {
    return new Date(s).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
};

export default function RewardsPage() {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<walletApi.WalletDto | null>(null);
  const [referral, setReferral] = useState<referralsApi.ReferralStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [w, r] = await Promise.all([
          walletApi.myWallet(5),
          referralsApi.myReferralStats(),
        ]);
        setWallet(w);
        setReferral(r);
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Could not load rewards",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const walletBalance = wallet ? minorToRupees(wallet.balanceMinor) : 0;
  const totalEarned = referral ? minorToRupees(referral.totalEarnedMinor) : 0;
  const referrerReward = referral ? minorToRupees(referral.referrerRewardMinor) : 0;
  const refereeDiscount = referral ? minorToRupees(referral.refereeDiscountMinor) : 0;

  const shareLink =
    referral && typeof window !== "undefined"
      ? `${window.location.origin}/auth/register?ref=${referral.code}`
      : "";

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: `${label} copied!` });
    setTimeout(() => setCopied(false), 2500);
  };

  const share = async () => {
    if (!referral) return;
    const text = `Use my code ${referral.code} on Baefikra and get ₹${refereeDiscount.toLocaleString()} off your first order: ${shareLink}`;
    if (navigator.share) {
      await navigator.share({ title: "Baefikra", text, url: shareLink });
    } else {
      copy(text, "Invite message");
    }
  };

  const earnWays = [
    {
      icon: Users,
      title: "Refer a Friend",
      description: `Earn ₹${referrerReward.toLocaleString() || "—"} for every friend who places their first order`,
      action: { label: "View Referral", href: "/account/referral" },
      color: "bg-purple-50 text-purple-600",
    },
    {
      icon: ShoppingBag,
      title: "Shop & Earn",
      description: "Every order earns wallet credits you can use on your next purchase",
      action: { label: "Shop Now", href: "/products" },
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: Percent,
      title: "Use Coupons",
      description: "Grab current offers and apply them at checkout to save instantly",
      action: { label: "View Offers", href: "/offers" },
      color: "bg-green-50 text-green-600",
    },
    {
      icon: Gift,
      title: "Redeem Gift Cards",
      description: "Have a gift card? Add it to your wallet and use it anytime",
      action: { label: "Redeem Now", href: "/account/wallet" },
      color: "bg-brand-50 text-brand-500",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>

      {/* Balance summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          loading={loading}
          icon={Wallet}
          label="Wallet Balance"
          value={`₹${walletBalance.toLocaleString("en-IN")}`}
          accent="yellow"
        />
        <SummaryCard
          loading={loading}
          icon={TrendingUp}
          label="Total Earned (Referrals)"
          value={`₹${totalEarned.toLocaleString("en-IN")}`}
          accent="purple"
        />
        <SummaryCard
          loading={loading}
          icon={Users}
          label="Friends Who Ordered"
          value={referral?.paidFirstOrder ?? 0}
          accent="green"
        />
      </div>

      {/* Referral card */}
      <Card className="bg-gradient-to-br from-purple-600 to-pink-500 text-white border-0 overflow-hidden">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Gift className="w-10 h-10 mb-2" />
            <p className="text-xl font-bold">
              Earn ₹{loading ? "—" : referrerReward.toLocaleString()} per referral
            </p>
            <p className="text-sm text-white/80 mt-1">
              Your friend gets ₹{loading ? "—" : refereeDiscount.toLocaleString()} off their first order. You get rewarded when they pay.
            </p>
            {referral && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="font-mono text-lg font-bold bg-white/20 px-3 py-1 rounded">
                  {referral.code}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white/10"
                  onClick={() => copy(referral.code, "Code")}
                >
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}
          </div>
          <Button
            onClick={share}
            className="bg-white text-purple-600 hover:bg-purple-50 font-bold flex-shrink-0"
          >
            <Share2 className="w-4 h-4 mr-2" /> Share & Earn
          </Button>
        </CardContent>
      </Card>

      {/* Wallet quick view */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Wallet
            </CardTitle>
            <Link href="/account/wallet">
              <Button variant="ghost" size="sm" className="text-brand-500 gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <CardDescription>Recent wallet activity</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !wallet || wallet.entries.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No wallet activity yet. Start earning by referring friends!
            </p>
          ) : (
            <ul className="divide-y">
              {wallet.entries.slice(0, 5).map((e) => {
                const amount = BigInt(e.amountMinor);
                const isCredit = amount >= BigInt(0);
                const abs = isCredit ? amount : -amount;
                return (
                  <li key={e.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{e.note ?? prettyType(e.sourceType)}</p>
                      <p className="text-xs text-gray-400">{formatDate(e.createdAt)}</p>
                    </div>
                    <p className={`font-bold text-sm flex-shrink-0 ${isCredit ? "text-green-700" : "text-red-700"}`}>
                      {isCredit ? "+" : "−"}₹{minorToRupees(abs.toString()).toLocaleString()}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Ways to earn */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-brand-500" /> Ways to Earn
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {earnWays.map((way) => (
            <Card key={way.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${way.color}`}>
                  <way.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{way.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{way.description}</p>
                  <Link href={way.action.href}>
                    <Badge variant="outline" className="mt-2 cursor-pointer hover:bg-gray-50 text-xs">
                      {way.action.label} →
                    </Badge>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  loading,
  icon: Icon,
  label,
  value,
  accent,
}: {
  loading: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent: "yellow" | "purple" | "green";
}) {
  const colors = {
    yellow: "bg-brand-50 text-brand-500",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colors[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{label}</p>
          {loading ? (
            <Skeleton className="h-6 w-20 mt-1" />
          ) : (
            <p className="text-xl font-bold">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function prettyType(t: string): string {
  const map: Record<string, string> = {
    gift_card: "Gift card redeemed",
    referral_reward: "Referral reward",
    admin_credit: "Wallet credit",
    order_apply: "Used on an order",
    refund: "Refund credited",
  };
  return map[t] ?? t.replace(/_/g, " ");
}
