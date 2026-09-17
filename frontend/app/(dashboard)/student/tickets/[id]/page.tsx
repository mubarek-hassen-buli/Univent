"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTicket } from "@/lib/query/registrations.query";
import { TicketPass } from "@/components/tickets/ticket-pass";

interface TicketDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = use(params);
  const { data: ticket, isLoading, isError } = useTicket(id);

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

      {/* Boarding Pass */}
      <TicketPass ticket={ticket} variant="full" />
    </div>
  );
}
