"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTicket } from "@/lib/query/registrations.query";
import { TicketPass } from "@/components/tickets/ticket-pass";
import { useAuth } from "@/hooks/use-auth";
import { usePusherChannel } from "@/hooks/use-pusher";
import { useQueryClient } from "@tanstack/react-query";

interface TicketDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: ticket, isLoading, isError } = useTicket(id);
  const [justAttended, setJustAttended] = useState(false);

  // Real-time attendance verification listener
  usePusherChannel(user?.id ? `user-${user.id}` : null, {
    "ticket:attended": (data: unknown) => {
      const payload = data as { registrationId?: string };
      if (!payload?.registrationId || payload.registrationId === id) {
        queryClient.invalidateQueries({ queryKey: ["ticket", id] });
        queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
        setJustAttended(true);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading digital boarding pass...</p>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <h2 className="text-lg font-bold text-foreground">Pass Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not locate this digital event pass. It may have been removed or belongs to another account.
        </p>
        <Link href="/student/tickets" className="mt-6 inline-block">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to My Passes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb / Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/student/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to All Passes
        </Link>
        <span className="font-mono text-xs text-muted-foreground">
          Code: {ticket.registrationCode}
        </span>
      </div>

      {/* Live Attendance Verification Alert */}
      {justAttended && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="text-sm">
            <p className="font-semibold">Attendance Verified in Real-Time! 🎉</p>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
              Your pass has been scanned at the entrance. Your attendance has been officially confirmed!
            </p>
          </div>
        </div>
      )}

      {/* Boarding Pass */}
      <TicketPass ticket={ticket} variant="full" />
    </div>
  );
}
