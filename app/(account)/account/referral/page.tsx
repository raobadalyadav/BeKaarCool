"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Gift,
  Copy,
  Check,
  Share2,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as referralsApi from "@/lib/api/referrals";
import { minorToRupees } from "@/lib/api/config";

export default function ReferralPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<referralsApi.ReferralStatsDto | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setStats(await referralsApi.myReferralStats());
      } catch (e) {
        toast({
          title: "Error",
          description:
            e instanceof Error ? e.message : "Could not load stats",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareLink = stats
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/auth/register?ref=${stats.code}`
    : "";

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: `${label} copied`, description: text });
    setTimeout(() => setCopied(false), 2500);
  };

  const share = async () => {
    if (!stats) return;
    const text = `Use my code ${stats.code} on Baefikra and get ₹${minorToRupees(stats.refereeDiscountMinor).toLocaleString()} off your first order: ${shareLink}`;
    if (navigator.share) {
      await navigator.share({ title: "Baefikra", text, url: shareLink });
    } else {
      copy(text, "Invite message");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Refer & Earn</h1>

      <Card className="bg-gradient-to-br from-purple-600 to-pink-500 text-white border-0 overflow-hidden">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Gift className="w-10 h-10 mb-2" />
            <p className="text-lg font-bold">
              Earn ₹
              {stats
                ? minorToRupees(stats.referrerRewardMinor).toLocaleString()
                : "—"}
              {" "}
              for every friend
            </p>
            <p className="text-sm text-white/80 mt-1">
              They get ₹
              {stats
                ? minorToRupees(stats.refereeDiscountMinor).toLocaleString()
                : "—"}
              {" "}
              off their first order. You get the reward when they pay for it.
            </p>
          </div>
          <Button onClick={share} className="bg-white text-purple-600 font-bold">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your referral code</CardTitle>
          <CardDescription>Share with friends and earn rewards.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-12 w-64" />
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="font-mono text-2xl font-bold tracking-wider px-4 py-2 bg-orange-50 border border-orange-200 rounded">
                {stats?.code}
              </div>
              <Button
                variant="outline"
                onClick={() => stats && copy(stats.code, "Code")}
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied ? "Copied" : "Copy code"}
              </Button>
              <Button
                variant="outline"
                onClick={() => copy(shareLink, "Link")}
              >
                <Copy className="w-4 h-4 mr-2" /> Copy link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          loading={loading}
          icon={Users}
          label="Friends signed up"
          value={stats?.signedUp ?? 0}
        />
        <StatCard
          loading={loading}
          icon={TrendingUp}
          label="Friends who ordered"
          value={stats?.paidFirstOrder ?? 0}
        />
        <StatCard
          loading={loading}
          icon={Gift}
          label="Total earned"
          value={
            stats
              ? `₹${minorToRupees(stats.totalEarnedMinor).toLocaleString()}`
              : "₹0"
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <p>1. Share your code or link with friends.</p>
          <p>
            2. They sign up using your code and get ₹
            {stats
              ? minorToRupees(stats.refereeDiscountMinor).toLocaleString()
              : "—"}{" "}
            off their first order.
          </p>
          <p>
            3. When they pay for that order, ₹
            {stats
              ? minorToRupees(stats.referrerRewardMinor).toLocaleString()
              : "—"}{" "}
            lands in your wallet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  loading,
  icon: Icon,
  label,
  value,
}: {
  loading: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[#F38508]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{label}</p>
          {loading ? (
            <Skeleton className="h-6 w-16 mt-1" />
          ) : (
            <p className="text-xl font-bold">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
