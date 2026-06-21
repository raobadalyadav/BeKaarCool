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
import { Separator } from "@/components/ui/separator";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  Smartphone,
  Monitor,
  LogOut,
  Loader2,
  KeyRound,
  QrCode,
  CheckCircle,
  Download,
  Trash2,
  AlertTriangle,
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

// ─── Sessions ────────────────────────────────────────────────────────────────

function SessionsSection() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      setSessions(await usersApi.mySessions());
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Could not load sessions",
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

  const revoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await usersApi.revokeSession(sessionId);
      toast({ title: "Session revoked" });
      await refresh();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "", variant: "destructive" });
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
      toast({ title: "Error", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setLogoutAllLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" /> Active Sessions
            </CardTitle>
            <CardDescription>Devices currently signed into your account.</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logoutAll}
            disabled={logoutAllLoading}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            {logoutAllLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
            Sign out everywhere
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-500">No active sessions.</p>
        ) : (
          <ul className="divide-y">
            {sessions.map((s) => {
              const isMobile = /mobile|android|iphone/i.test(s.userAgent ?? "");
              return (
                <li key={s.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {isMobile ? <Smartphone className="w-5 h-5 text-gray-500" /> : <Monitor className="w-5 h-5 text-gray-500" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{s.device ?? (isMobile ? "Mobile" : "Desktop")}</p>
                        <Badge variant="outline" className="text-[10px]">{s.ip ?? "—"}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate max-w-md">{s.userAgent ?? "Unknown user-agent"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Last seen {formatDate(s.lastSeenAt)}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={revoking === s.sessionId}
                    onClick={() => revoke(s.sessionId)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {revoking === s.sessionId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Revoke"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Password ─────────────────────────────────────────────────────────────────

function PasswordSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="w-5 h-5" /> Password
        </CardTitle>
        <CardDescription>Manage your sign-in credentials.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Change your password from the{" "}
          <a className="text-yellow-600 underline" href="/account/profile">Profile</a> page.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── 2FA / TOTP ───────────────────────────────────────────────────────────────

type TotpPhase = "idle" | "setup" | "verify" | "enabled" | "disable";

function TwoFactorSection() {
  const { toast } = useToast();
  const [phase, setPhase] = useState<TotpPhase>("idle");
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    try {
      const data = await usersApi.setupTotp();
      setSetupData(data);
      setPhase("setup");
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Setup failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const enable = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      await usersApi.enableTotp(code);
      setPhase("enabled");
      setCode("");
      toast({ title: "Two-factor authentication enabled" });
    } catch (e) {
      toast({ title: "Invalid code", description: "Please try again with a fresh code from your authenticator app.", variant: "destructive" });
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      await usersApi.disableTotp(code);
      setPhase("idle");
      setCode("");
      setSetupData(null);
      toast({ title: "Two-factor authentication disabled" });
    } catch (e) {
      toast({ title: "Invalid code", description: "Please check the code in your authenticator app.", variant: "destructive" });
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" /> Two-Factor Authentication (2FA)
        </CardTitle>
        <CardDescription>
          Add an extra layer of security using an authenticator app (Google Authenticator, Authy, etc.).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {phase === "idle" && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-sm">2FA is not enabled</p>
              <p className="text-xs text-gray-500 mt-1">Protect your account with a one-time code on every login.</p>
            </div>
            <Button onClick={startSetup} disabled={loading} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Set up 2FA
            </Button>
          </div>
        )}

        {phase === "setup" && setupData && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-sm mb-2">Step 1 — Add to your authenticator app</p>
              <p className="text-xs text-gray-600 mb-3">
                Open Google Authenticator or Authy, tap "Add account" → "Enter setup key", then paste the key below.
              </p>
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-gray-500">Manual entry key</Label>
                <div className="flex items-center gap-2 bg-white border rounded px-3 py-2">
                  <code className="font-mono text-sm flex-1 break-all">{setupData.secret}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { navigator.clipboard.writeText(setupData.secret); toast({ title: "Secret copied" }); }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <p className="font-semibold text-sm">Step 2 — Enter the 6-digit code from your app</p>
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={enable}
                  disabled={loading || code.length !== 6}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Verify & Enable
                </Button>
                <Button variant="outline" onClick={() => { setPhase("idle"); setCode(""); setSetupData(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {phase === "enabled" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-green-800">2FA is active</p>
                <p className="text-xs text-green-700 mt-0.5">Your account is protected with two-factor authentication.</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => { setPhase("disable"); setCode(""); }}
            >
              Disable 2FA
            </Button>
          </div>
        )}

        {phase === "disable" && (
          <div className="space-y-4 p-4 border border-red-200 rounded-lg bg-red-50">
            <p className="font-semibold text-sm text-red-800">Disable Two-Factor Authentication</p>
            <p className="text-xs text-red-700">Enter the current code from your authenticator app to confirm.</p>
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <div className="flex gap-2">
              <Button
                onClick={disable}
                disabled={loading || code.length !== 6}
                variant="destructive"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Confirm Disable
              </Button>
              <Button variant="outline" onClick={() => { setPhase("enabled"); setCode(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Always show disable flow for users who set up 2FA in a previous session */}
        {phase === "idle" && (
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 text-xs"
              onClick={() => { setPhase("disable"); setCode(""); }}
            >
              Already have 2FA enabled? Disable it here.
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Data Privacy ─────────────────────────────────────────────────────────────

function DataPrivacySection() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const json = await usersApi.exportMyData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `baefikra-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Data exported", description: "Your data has been downloaded." });
    } catch (e) {
      toast({ title: "Export failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await usersApi.requestAccountDeletion();
      toast({
        title: "Deletion request submitted",
        description: "Your account will be permanently deleted within 30 days. You'll receive a confirmation email.",
      });
    } catch (e) {
      toast({ title: "Request failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Data & Privacy
        </CardTitle>
        <CardDescription>Manage your personal data in compliance with DPDP regulations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-sm">Export My Data</p>
            <p className="text-xs text-gray-500 mt-1">Download a JSON copy of all your account data.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            {exporting ? "Exporting…" : "Export Data"}
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
          <div>
            <p className="font-medium text-sm text-red-900">Delete My Account</p>
            <p className="text-xs text-red-700 mt-1">
              Permanently deletes all your data. This cannot be undone. A 30-day grace period applies.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-100 flex-shrink-0">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-700">
                  <Trash2 className="w-5 h-5" /> Delete your account?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your profile, orders history, wallet balance, and all associated data.
                  A confirmation email will be sent and deletion completes within 30 days. You can cancel within that window by contacting support.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={deleteAccount}
                  disabled={deleting}
                >
                  {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Yes, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Security & Privacy</h1>
      <SessionsSection />
      <PasswordSection />
      <TwoFactorSection />
      <DataPrivacySection />
    </div>
  );
}
