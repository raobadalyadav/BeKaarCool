"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Bell, Mail, MessageSquare, Smartphone,
  ShoppingBag, Truck, PackageCheck, RefreshCcw,
  Megaphone, Timer, Tag, Sparkles, CheckCircle2, XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as usersApi from "@/lib/api/users";
import type { NotificationDto } from "@/lib/api/types";

// ─── Preference definitions ────────────────────────────────────────────────

type PrefItem = {
  purpose: string;
  label: string;
  description: string;
  icon: React.ElementType;
};

const EMAIL_PREFS: PrefItem[] = [
  { purpose: "email_order_confirm", label: "Order Confirmation", description: "Receipt and details as soon as you place an order", icon: ShoppingBag },
  { purpose: "email_shipping",      label: "Shipping Update",    description: "Courier handover and AWB tracking number",        icon: Truck },
  { purpose: "email_delivery",      label: "Delivery Update",    description: "Out for delivery and delivered confirmations",     icon: PackageCheck },
  { purpose: "email_order_update",  label: "Order Update",       description: "Status changes, delays, and cancellation alerts", icon: RefreshCcw },
];

const WHATSAPP_PREFS: PrefItem[] = [
  { purpose: "whatsapp_order",         label: "Order Updates",       description: "Real-time order and delivery status on WhatsApp", icon: ShoppingBag },
  { purpose: "whatsapp_abandoned_cart",label: "Abandoned Cart",      description: "Gentle reminder when you leave items in your bag", icon: Timer },
  { purpose: "whatsapp_promo",         label: "Promotional Campaign", description: "Exclusive deals, flash sales, and coupons",       icon: Megaphone },
];

const PUSH_PREFS: PrefItem[] = [
  { purpose: "push_new_products",   label: "New Products",  description: "Be first to know when new drops go live",      icon: Sparkles },
  { purpose: "push_sale",           label: "Sale Alerts",   description: "Notified the moment a sale or discount starts", icon: Tag },
  { purpose: "push_back_in_stock",  label: "Back In Stock", description: "Alerts when your wishlisted items are available", icon: Bell },
];

// ─── Channel Section Component ─────────────────────────────────────────────

function channelColor(channel: string) {
  switch (channel) {
    case "email":     return "bg-blue-50 text-blue-600";
    case "whatsapp":  return "bg-green-50 text-green-600";
    case "push":      return "bg-purple-50 text-purple-600";
    case "sms":       return "bg-brand-50 text-orange-600";
    default:          return "bg-gray-100 text-gray-500";
  }
}

function ChannelIcon({ channel }: { channel: string }) {
  const cls = `w-4 h-4`;
  switch (channel) {
    case "email":    return <Mail className={cls} />;
    case "whatsapp": return <MessageSquare className={cls} />;
    case "push":     return <Smartphone className={cls} />;
    default:         return <Bell className={cls} />;
  }
}

// ─── Pref Toggle Row ───────────────────────────────────────────────────────

function PrefRow({
  item,
  granted,
  saving,
  onToggle,
}: {
  item: PrefItem;
  granted: boolean;
  saving: boolean;
  onToggle: (purpose: string, value: boolean) => void;
}) {
  const Icon = item.icon;
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-brand-500" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{item.label}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
        </div>
      </div>
      <Switch
        checked={granted}
        disabled={saving}
        onCheckedChange={(v) => onToggle(item.purpose, v)}
        className="flex-shrink-0 data-[state=checked]:bg-brand-500"
      />
    </div>
  );
}

// ─── Pref Section Card ─────────────────────────────────────────────────────

function PrefSection({
  title,
  description,
  icon: Icon,
  iconBg,
  items,
  prefs,
  saving,
  onToggle,
  loading,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  items: PrefItem[];
  prefs: Record<string, boolean>;
  saving: string | null;
  onToggle: (purpose: string, value: boolean) => void;
  loading: boolean;
}) {
  const allOn = items.every((i) => prefs[i.purpose] !== false);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            </div>
          </div>
          {!loading && (
            <Badge variant="outline" className={allOn ? "border-green-200 text-green-700 text-xs" : "border-gray-200 text-gray-500 text-xs"}>
              {allOn ? "All on" : "Some off"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-4 pt-4">
            {items.map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <PrefRow
                key={item.purpose}
                item={item}
                granted={prefs[item.purpose] !== false}
                saving={saving === item.purpose}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Notification History ──────────────────────────────────────────────────

function NotificationHistory({ items, loading }: { items: NotificationDto[]; loading: boolean }) {
  const fmt = (s: string) => {
    const d = new Date(s);
    return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Recent Notifications</CardTitle>
        <CardDescription className="text-xs">Last 50 messages sent to you</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No notifications sent yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((n) => {
              const delivered = n.status === "delivered" || !!n.deliveredAt;
              return (
                <li key={n.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${channelColor(n.channel)}`}>
                      <ChannelIcon channel={n.channel} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{n.subject ?? n.template}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{fmt(n.createdAt)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`flex-shrink-0 text-xs ${delivered ? "border-green-200 text-green-700" : "border-amber-200 text-amber-700"}`}>
                    {delivered ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {delivered ? "Delivered" : n.status}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [history, setHistory] = useState<NotificationDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      usersApi.myNotificationPreferences().then((list) => {
        const map: Record<string, boolean> = {};
        list.forEach((p) => { map[p.purpose] = p.granted; });
        setPrefs(map);
        setPrefsLoading(false);
      }),
      usersApi.myNotifications(50).then((list) => {
        setHistory(list);
        setHistoryLoading(false);
      }),
    ]).then((results) => {
      results.forEach((r) => {
        if (r.status === "rejected") {
          setPrefsLoading(false);
          setHistoryLoading(false);
        }
      });
    });
  }, []);

  const handleToggle = useCallback(async (purpose: string, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [purpose]: value }));
    setSaving(purpose);
    try {
      await usersApi.updateNotificationPreference(purpose, value);
      toast({ title: value ? "Notifications enabled" : "Notifications disabled" });
    } catch {
      setPrefs((prev) => ({ ...prev, [purpose]: !value }));
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }, [toast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">Choose which updates you want to receive and how.</p>
      </div>

      {/* Preference sections */}
      <PrefSection
        title="Email"
        description="Transactional and order updates to your inbox"
        icon={Mail}
        iconBg="bg-blue-50 text-blue-600"
        items={EMAIL_PREFS}
        prefs={prefs}
        saving={saving}
        onToggle={handleToggle}
        loading={prefsLoading}
      />

      <PrefSection
        title="WhatsApp"
        description="Order alerts and offers on WhatsApp"
        icon={MessageSquare}
        iconBg="bg-green-50 text-green-600"
        items={WHATSAPP_PREFS}
        prefs={prefs}
        saving={saving}
        onToggle={handleToggle}
        loading={prefsLoading}
      />

      <PrefSection
        title="Push Notifications"
        description="Browser and app push alerts"
        icon={Smartphone}
        iconBg="bg-purple-50 text-purple-600"
        items={PUSH_PREFS}
        prefs={prefs}
        saving={saving}
        onToggle={handleToggle}
        loading={prefsLoading}
      />

      <Separator />

      {/* History */}
      <NotificationHistory items={history} loading={historyLoading} />
    </div>
  );
}
