"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Mail,
  MessageSquare,
  PhoneCall,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as usersApi from "@/lib/api/users";
import type { NotificationDto } from "@/lib/api/types";

const formatDate = (s: string) => {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
};

const channelIcon = (channel: string) => {
  switch (channel) {
    case "email":
      return Mail;
    case "sms":
      return MessageSquare;
    case "whatsapp":
      return PhoneCall;
    default:
      return Bell;
  }
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await usersApi.myNotifications(50);
        setItems(list);
      } catch (e) {
        toast({
          title: "Error",
          description:
            e instanceof Error ? e.message : "Could not load notifications",
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
      <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Order updates, promotions, and security alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              You don&apos;t have any notifications yet.
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const Icon = channelIcon(n.channel);
                const delivered = n.status === "delivered" || !!n.deliveredAt;
                return (
                  <li
                    key={n.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {n.subject ?? n.template}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(n.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        delivered
                          ? "border-green-200 text-green-700"
                          : "border-amber-200 text-amber-700"
                      }
                    >
                      {delivered ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {delivered ? "Delivered" : n.status}
                    </Badge>
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
