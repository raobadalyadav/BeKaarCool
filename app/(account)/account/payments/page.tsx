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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Wallet,
  Banknote,
  Package,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as ordersApi from "@/lib/api/orders";
import type { OrderDto } from "@/lib/api/types";
import { minorToRupees } from "@/lib/api/config";

const formatDate = (s: string) => {
  try {
    return new Date(s).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
};

function paymentIcon(method?: string | null) {
  if (!method) return <CreditCard className="w-4 h-4" />;
  if (method === "cod") return <Banknote className="w-4 h-4" />;
  return <CreditCard className="w-4 h-4" />;
}

function paymentLabel(method?: string | null) {
  if (!method) return "—";
  if (method === "cod") return "Cash on Delivery";
  if (method === "razorpay") return "Online Payment";
  return method;
}

function statusBadge(status?: string) {
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
          <CheckCircle2 className="w-3 h-3" /> Paid
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-orange-100 text-[#D97706] border-orange-200 gap-1">
          <Clock className="w-3 h-3" /> Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
          <XCircle className="w-3 h-3" /> Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-gray-500">
          {status ?? "—"}
        </Badge>
      );
  }
}

export default function PaymentsPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await ordersApi.listOrders(20);
        setOrders(list.filter((o) => o.paymentMethod));
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Could not load payment history",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">Your payment history from recent orders.</p>
      </div>

      {/* Info banner — Razorpay doesn't expose saved payment methods via API */}
      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="p-4 flex items-start gap-3">
          <Wallet className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-blue-900">About saved payment methods</p>
            <p className="text-xs text-blue-700 mt-1">
              Card and UPI details are securely stored with Razorpay. You can select saved cards at
              checkout — they are not stored on Baefikra servers.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Wallet shortcut */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/account/wallet">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-[#F38508]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Baefikra Wallet</p>
                <p className="text-xs text-gray-500 mt-0.5">View balance & transaction history</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/account/orders">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">All Orders</p>
                <p className="text-xs text-gray-500 mt-0.5">View orders and request returns</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <Separator />

      {/* Payment history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Payment History
          </CardTitle>
          <CardDescription>Payments from your recent orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center">
              <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No payment history yet</p>
              <p className="text-sm text-gray-400 mt-1">Completed orders will appear here.</p>
              <Link href="/products">
                <Button variant="outline" size="sm" className="mt-4">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y">
              {orders.map((order) => {
                const total = minorToRupees(order.totalMinor);
                return (
                  <li key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500">
                        {paymentIcon(order.paymentMethod)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">Order #{order.number}</p>
                          {statusBadge(order.paymentStatus)}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {paymentLabel(order.paymentMethod)} · {formatDate(order.paidAt ?? order.placedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                      <p className="font-bold text-sm">₹{total.toLocaleString("en-IN")}</p>
                      <Link href={`/account/orders/${order.number}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          View Order
                        </Button>
                      </Link>
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
