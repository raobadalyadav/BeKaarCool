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
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Smartphone,
  Monitor,
  LogOut,
  Loader2,
  KeyRound,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as usersApi from "@/lib/api/users";
import type { SessionDto } from "@/lib/api/types";

const formatDate = (s: string) => {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
};

export default function SecurityPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await usersApi.mySessions();
      setSessions(list);
    } catch (e) {
      toast({
        title: "Error",
        description:
          e instanceof Error ? e.message : "Could not load sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const revoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await usersApi.revokeSession(sessionId);
      toast({ title: "Session revoked" });
      await refresh();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setRevoking(null);
    }
  };

  const logoutAll = async () => {
    if (!confirm("Sign out of every device including this one?")) return;
    setLogoutAllLoading(true);
    try {
      await usersApi.logoutAllDevices();
      toast({ title: "Logged out everywhere" });
      window.location.href = "/auth/login";
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setLogoutAllLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Security</h1>
        <Button
          variant="outline"
          onClick={logoutAll}
          disabled={logoutAllLoading}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          {logoutAllLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <LogOut className="w-4 h-4 mr-2" />
          )}
          Sign out everywhere
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Active sessions
          </CardTitle>
          <CardDescription>
            Devices currently signed into your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-gray-500">No active sessions.</p>
          ) : (
            <ul className="divide-y">
              {sessions.map((s) => {
                const isMobile = /mobile|android|iphone/i.test(
                  s.userAgent ?? ""
                );
                return (
                  <li
                    key={s.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {isMobile ? (
                          <Smartphone className="w-5 h-5 text-gray-500" />
                        ) : (
                          <Monitor className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">
                            {s.device ?? (isMobile ? "Mobile" : "Desktop")}
                          </p>
                          <Badge variant="outline" className="text-[10px]">
                            {s.ip ?? "—"}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 truncate max-w-md">
                          {s.userAgent ?? "Unknown user-agent"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Last seen {formatDate(s.lastSeenAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={revoking === s.sessionId}
                      onClick={() => revoke(s.sessionId)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {revoking === s.sessionId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Revoke"
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Password
          </CardTitle>
          <CardDescription>
            Manage your sign-in credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Change your password from the{" "}
            <a className="text-yellow-600 underline" href="/account/profile">
              Profile
            </a>{" "}
            page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
