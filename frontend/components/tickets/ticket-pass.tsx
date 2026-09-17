"use client";

import React, { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Printer,
  XCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  User,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCancelRegistration, type TicketItem } from "@/lib/query/registrations.query";

interface TicketPassProps {
  ticket: TicketItem;
  variant?: "full" | "compact";
  onCancelled?: () => void;
}

export function TicketPass({ ticket, variant = "full", onCancelled }: TicketPassProps) {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const cancelMutation = useCancelRegistration();

  const startDate = new Date(ticket.event.startDate);
  const endDate = new Date(ticket.event.endDate);

  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedStartTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const formattedEndTime = endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(ticket.id);
      setIsConfirmingCancel(false);
      onCancelled?.();
    } catch (err) {
      console.error("Failed to cancel ticket:", err);
    }
  };

  const isCancelled = ticket.status === "CANCELLED";
  const isAttended = ticket.hasAttended;
  const isConfirmed = ticket.status === "CONFIRMED" && !isAttended;

  // Status Badge Component
  const StatusBadge = () => {
    if (isCancelled) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
          <XCircle className="h-3 w-3" />
          Cancelled
        </span>
      );
    }
    if (isAttended) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <CheckCircle2 className="h-3 w-3" />
          Attended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <ShieldCheck className="h-3 w-3" />
        Valid Pass
      </span>
    );
  };

  // Compact Variant (Cards in list view)
  if (variant === "compact") {
    return (
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition duration-200 hover:border-primary/40 hover:shadow-md">
        {/* Banner strip */}
        <div className="relative h-28 w-full overflow-hidden bg-muted">
          {ticket.event.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ticket.event.bannerUrl}
              alt={ticket.event.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
              <GraduationCap className="h-10 w-10 opacity-40" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <StatusBadge />
          </div>
          {ticket.category && (
            <div className="absolute bottom-2 left-2">
              <span className="rounded bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur-xs">
                {ticket.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <span className="font-mono text-xs font-semibold text-primary tracking-wider">
              {ticket.registrationCode}
            </span>
            <h3 className="line-clamp-1 text-base font-semibold text-foreground">
              {ticket.event.title}
            </h3>
          </div>

          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                {formattedStartTime} &ndash; {formattedEndTime}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {ticket.event.isOnline ? (
                <>
                  <Globe className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">Online Event</span>
                </>
              ) : (
                <>
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{ticket.event.location}</span>
                </>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {isAttended && ticket.attendedAt
                ? `Checked in ${new Date(ticket.attendedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                : `Issued ${new Date(ticket.registeredAt).toLocaleDateString()}`}
            </span>
            <Link href={`/student/tickets/${ticket.id}`}>
              <Button size="xs" variant="outline" className="gap-1 text-xs">
                View Pass
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Full Boarding Pass Variant
  return (
    <div className="space-y-4">
      {/* Boarding Pass Container */}
      <div
        id={`ticket-pass-${ticket.id}`}
        className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg print:border-none print:shadow-none print:m-0"
      >
        {/* Top Header / Brand Bar */}
        <div className="bg-primary/5 px-6 py-4 border-b border-border/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">
              Univent Digital Event Pass
            </span>
          </div>
          <div className="flex items-center gap-2">
            {ticket.category && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {ticket.category.name}
              </span>
            )}
            <StatusBadge />
          </div>
        </div>

        {/* Boarding Pass Body (2 columns: Pass Info + QR Stub) */}
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Main Pass Info (2 columns) */}
          <div className="p-6 md:col-span-2 space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Event
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {ticket.event.title}
              </h2>
              {ticket.organizer?.name ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Organized by {ticket.organizer.name}
                  {ticket.organizer.department ? ` (${ticket.organizer.department})` : ""}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  University Event Pass
                </p>
              )}
            </div>

            {/* Date & Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-muted/40 p-4 border border-border/50">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Date
                </span>
                <p className="text-sm font-semibold text-foreground">{formattedDate}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Time
                </span>
                <p className="text-sm font-semibold text-foreground">
                  {formattedStartTime} &ndash; {formattedEndTime}
                </p>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span className="text-[11px] font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  {ticket.event.isOnline ? (
                    <Globe className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                  )}
                  Location / Venue
                </span>
                <p className="text-sm font-semibold text-foreground">
                  {ticket.event.location}
                </p>
                {ticket.event.isOnline && ticket.event.meetingLink && (
                  <div className="mt-2 rounded-md bg-primary/10 p-2.5 text-xs text-primary font-medium flex items-center justify-between gap-2">
                    <span className="truncate">Meeting Link: {ticket.event.meetingLink}</span>
                    <a
                      href={ticket.event.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold shrink-0"
                    >
                      Join Room
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Attendee Info */}
            <div className="border-t border-border/70 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Attendee Name
                </span>
                <p className="text-xs font-semibold text-foreground truncate">
                  {ticket.student?.name || "Enrolled Student"}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Student ID
                </span>
                <p className="text-xs font-mono font-semibold text-foreground">
                  {ticket.student?.studentId || "N/A"}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Department
                </span>
                <p className="text-xs font-semibold text-foreground truncate">
                  {ticket.student?.department || "General"}
                </p>
              </div>
            </div>
          </div>

          {/* Perforation Cutout & QR Stub (1 column) */}
          <div className="relative border-t md:border-t-0 md:border-l border-dashed border-border bg-card/60 p-6 flex flex-col items-center justify-center text-center">
            {/* Notch circles for boarding pass aesthetic */}
            <div className="hidden md:block absolute -top-3.5 -left-3.5 h-7 w-7 rounded-full bg-background border border-border" />
            <div className="hidden md:block absolute -bottom-3.5 -left-3.5 h-7 w-7 rounded-full bg-background border border-border" />

            {/* QR Code Container (High-contrast clean white surface for barcode scanners) */}
            <div className="rounded-xl bg-white p-3.5 shadow-xs border border-neutral-200">
              {isCancelled ? (
                <div className="flex h-36 w-36 flex-col items-center justify-center text-destructive">
                  <XCircle className="h-10 w-10 opacity-60" />
                  <span className="mt-2 text-xs font-bold uppercase tracking-wider">
                    Void Pass
                  </span>
                </div>
              ) : (
                <QRCodeSVG
                  value={ticket.qrHash}
                  size={144}
                  level="H"
                  includeMargin={false}
                  className="h-36 w-36"
                />
              )}
            </div>

            {/* Registration Code Badge */}
            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Registration Code
              </span>
              <p className="font-mono text-sm font-bold tracking-widest text-primary">
                {ticket.registrationCode}
              </p>
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground max-w-[200px]">
              {isCancelled
                ? "This pass has been cancelled and cannot be scanned."
                : isAttended
                  ? "Attendance verified by event organizer."
                  : "Present this digital pass at the entrance scanner for check-in."}
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar (Print / Cancel / Back) - Hidden during print */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
        <Link href="/student/tickets">
          <Button variant="ghost" size="sm">
            &larr; All Passes
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {/* Print Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print Pass
          </Button>

          {/* Cancellation Button / Modal */}
          {isConfirmed && (
            <>
              {isConfirmingCancel ? (
                <div className="flex items-center gap-1.5 bg-destructive/10 p-1.5 rounded-lg border border-destructive/20">
                  <span className="text-xs text-destructive font-medium px-2">
                    Cancel this pass?
                  </span>
                  <Button
                    variant="destructive"
                    size="xs"
                    disabled={cancelMutation.isPending}
                    onClick={handleCancel}
                    className="gap-1 text-xs"
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Confirm Cancel"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    disabled={cancelMutation.isPending}
                    onClick={() => setIsConfirmingCancel(false)}
                    className="text-xs"
                  >
                    Keep
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConfirmingCancel(true)}
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Registration
                </Button>
              )}
            </>
          )}

          {/* View Event link */}
          <Link href={`/events/${ticket.event.slug}`}>
            <Button variant="secondary" size="sm" className="gap-1.5">
              Event Details
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
