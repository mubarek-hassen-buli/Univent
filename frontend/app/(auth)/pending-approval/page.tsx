"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePusherChannel } from "@/hooks/use-pusher";
import { Button } from "@/components/ui/button";
import {
  Clock,
  ShieldCheck,
  Phone,
  Mail,
  Building,
  User,
  ArrowLeft,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();
  const { user, isApproved, role, logout, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [justApproved, setJustApproved] = useState(false);

  // If user is already approved or not an organizer, redirect to appropriate destination
  useEffect(() => {
    if (!isLoading && user) {
      if (role !== "organizer" || isApproved) {
        router.push(role === "admin" ? "/admin" : role === "organizer" ? "/organizer" : "/student");
      }
    }
  }, [user, isApproved, role, isLoading, router]);

  // Real-time synchronization via Pusher: automatic transition upon admin verification
  usePusherChannel(user?.id ? `organizer-${user.id}` : null, {
    "organizer:approved": () => {
      setJustApproved(true);
      setTimeout(() => {
        router.push("/organizer");
        router.refresh();
      }, 1800);
    },
  });

  // Also listen on global users channel as backup
  usePusherChannel("users", {
    "user:updated": (data: unknown) => {
      const updatedUser = data as { id?: string; isApproved?: boolean } | null;
      if (updatedUser?.id === user?.id && updatedUser?.isApproved) {
        setJustApproved(true);
        setTimeout(() => {
          router.push("/organizer");
          router.refresh();
        }, 1800);
      }
    },
  });

  const handleManualCheck = () => {
    setIsChecking(true);
    router.refresh();
    setTimeout(() => {
      setIsChecking(false);
    }, 1000);
  };

  if (justApproved) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-card p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 animate-bounce">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-foreground">
          Account Verified!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your organizer account has been approved by the administrator. Redirecting you to the console...
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-500">
          <Sparkles className="h-4 w-4" />
          Welcome to Univent Organizer Console
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
      {/* Status Header */}
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
          <Clock className="h-7 w-7 animate-pulse" />
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
          Pending Administrator Verification
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Account Awaiting Approval
        </h1>
        <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
          Thank you for registering as an event organizer. University policy requires manual administrative review of organizer credentials and phone numbers before event creation access is granted.
        </p>
      </div>

      {/* Submitted Details Card */}
      <div className="mt-6 divide-y divide-border/60 rounded-xl border border-border bg-muted/30 p-4 text-xs">
        <div className="flex items-center justify-between py-2">
          <span className="flex items-center gap-2 text-muted-foreground">
            <User className="h-3.5 w-3.5" /> Full Name
          </span>
          <span className="font-semibold text-foreground">{user?.name || "Organizer"}</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3.5 w-3.5" /> Email
          </span>
          <span className="font-semibold text-foreground">{user?.email || "—"}</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5" /> Phone Number
          </span>
          <span className="font-semibold font-mono text-primary">
            {user?.phoneNumber || "Registered on file"}
          </span>
        </div>

        {user?.department && (
          <div className="flex items-center justify-between py-2">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Building className="h-3.5 w-3.5" /> Department / Club
            </span>
            <span className="font-semibold text-foreground">{user.department}</span>
          </div>
        )}
      </div>

      {/* Real-time Indicator Note */}
      <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          <strong className="font-semibold">Live Real-time Sync:</strong> You don&apos;t need to refresh this screen. As soon as the administrator verifies your phone number and activates your account, this page will automatically unlock your dashboard.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <Button
          variant="outline"
          onClick={handleManualCheck}
          disabled={isChecking}
          className="flex-1 gap-2 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
          {isChecking ? "Checking Status..." : "Check Status Now"}
        </Button>

        <Button
          variant="ghost"
          onClick={() => logout()}
          className="gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>

      {/* Bottom Back to Home */}
      <div className="mt-6 border-t border-border pt-4 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
