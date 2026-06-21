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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Wallet as WalletIcon,
  Gift,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as walletApi from "@/lib/api/wallet";
import { minorToRupees } from "@/lib/api/config";

const formatDate = (s: string) => {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
};

export default function WalletPage() {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<walletApi.WalletDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const refresh = async () => {
    try {
      const w = await walletApi.myWallet(50);
      setWallet(w);
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Could not load wallet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !pin.trim()) return;
    setRedeeming(true);
    try {
      const r = await walletApi.redeemGiftCard(code.trim(), pin.trim());
      toast({
        title: "Gift card redeemed",
        description: `₹${minorToRupees(r.creditedMinor).toLocaleString()} added to your wallet`,
      });
      setCode("");
      setPin("");
      await refresh();
    } catch (e) {
      toast({
        title: "Could not redeem",
        description: e instanceof Error ? e.message : "Invalid code or PIN",
        variant: "destructive",
      });
    } finally {
      setRedeeming(false);
    }
  };

  const balance = wallet ? minorToRupees(wallet.balanceMinor) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>

      <Card className="bg-gradient-to-br from-[#F38508] to-[#D97706] text-white border-0">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-black/10 flex items-center justify-center">
            <WalletIcon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium opacity-80">Available balance</p>
            {loading ? (
              <Skeleton className="h-9 w-32 mt-1 bg-black/10" />
            ) : (
              <p className="text-3xl font-bold">
                ₹{balance.toLocaleString("en-IN")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" /> Redeem a gift card
          </CardTitle>
          <CardDescription>
            Adds the card&apos;s value to your wallet instantly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={redeem}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            <div className="sm:col-span-2">
              <Label>Card code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="GC..."
              />
            </div>
            <div>
              <Label>PIN</Label>
              <Input
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="6-digit"
                maxLength={6}
              />
            </div>
            <div className="sm:col-span-3">
              <Button
                type="submit"
                disabled={redeeming || !code.trim() || !pin.trim()}
                className="bg-[#F38508] hover:bg-[#D97706] text-black font-bold"
              >
                {redeeming && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Redeem
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !wallet || wallet.entries.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No transactions yet.
            </p>
          ) : (
            <ul className="divide-y">
              {wallet.entries.map((e) => {
                const amount = BigInt(e.amountMinor);
                const isCredit = amount >= BigInt(0);
                const abs = isCredit ? amount : -amount;
                return (
                  <li
                    key={e.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCredit ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        {isCredit ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">
                          {e.note ?? prettyType(e.sourceType)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(e.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`font-bold text-sm ${
                          isCredit ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {isCredit ? "+" : "−"} ₹
                        {minorToRupees(abs.toString()).toLocaleString()}
                      </p>
                      <Badge variant="outline" className="text-[10px] mt-0.5">
                        {e.kind}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function prettyType(t: string): string {
  switch (t) {
    case "gift_card":
      return "Gift card redeemed";
    case "referral_reward":
      return "Referral reward";
    case "admin_credit":
      return "Wallet credit";
    case "order_apply":
      return "Used on an order";
    case "refund":
      return "Refund credited";
    default:
      return t.replace(/_/g, " ");
  }
}
