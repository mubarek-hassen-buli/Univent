"use client";

import React from "react";
import Link from "next/link";
import {
  Ticket,
  CheckCircle2,
  Calendar,
  Compass,
  Award,
  ArrowRight,
  Clock,
  MapPin,
  ExternalLink,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMyTickets } from "@/lib/query/registrations.query";
import { useMyCertificates } from "@/lib/query/certificates.query";
import { TicketPass } from "@/components/tickets/ticket-pass";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { data: tickets = [], isLoading } = useMyTickets();
  const { data: certificates = [] } = useMyCertificates();

  const activeTickets = tickets.filter(
    (t) => t.status === "CONFIRMED" && !t.hasAttended,
  );
  const attendedTickets = tickets.filter((t) => t.hasAttended);
  const totalRegistrations = tickets.length;

  // Next upcoming ticket sorted by start date
  const nextTicket = [...activeTickets].sort(
    (a, b) =>
      new Date(a.event.startDate).getTime() - new Date(b.event.startDate).getTime(),
  )[0];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-background to-muted/50 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Student Portal
              </span>
              {user?.studentId && (
                <span className="font-mono text-xs text-muted-foreground">
                  ID: {user.studentId}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {user?.name || "Student"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user?.department
                ? `Department of ${user.department}`
                : "Manage your university event registrations, attendance passes, and certifications."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/student/tickets">
              <Button variant="secondary" className="gap-2">
                <Ticket className="h-4 w-4" />
                My Passes
              </Button>
            </Link>
            <Link href="/student/certificates">
              <Button variant="outline" className="gap-2">
                <Award className="h-4 w-4" />
                Certificates ({certificates.length})
              </Button>
            </Link>
            <Link href="/events">
              <Button className="gap-2">
                <Compass className="h-4 w-4" />
                Browse Events
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Passes
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Ticket className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground sm:text-3xl">
              {isLoading ? "..." : activeTickets.length}
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ready for entrance scan
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Attended Events
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground sm:text-3xl">
              {isLoading ? "..." : attendedTickets.length}
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Verified campus check-ins
            </p>
          </div>
        </div>

        <Link href="/student/certificates" className="block">
          <div className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Certificates
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-foreground sm:text-3xl">
                {isLoading ? "..." : certificates.length}
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Earned credentials &rarr;
              </p>
            </div>
          </div>
        </Link>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Registrations
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground sm:text-3xl">
              {isLoading ? "..." : totalRegistrations}
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Lifetime reservations
            </p>
          </div>
        </div>
      </div>

      {/* Featured Next Upcoming Pass */}
      {nextTicket && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Next Upcoming Event
            </h2>
            <Link
              href={`/student/tickets/${nextTicket.id}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              View Full Boarding Pass &rarr;
            </Link>
          </div>

          <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-xs">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Confirmed Pass
                  </span>
                  {nextTicket.category && (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {nextTicket.category.name}
                    </span>
                  )}
                  <span className="font-mono text-xs font-bold text-primary">
                    {nextTicket.registrationCode}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground">
                  {nextTicket.event.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {new Date(nextTicket.event.startDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    {new Date(nextTicket.event.startDate).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {nextTicket.event.location}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Link href={`/student/tickets/${nextTicket.id}`}>
                  <Button className="gap-2">
                    <Ticket className="h-4 w-4" />
                    Show QR Pass
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Passes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Recent Event Passes</h2>
          <Link
            href="/student/tickets"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all passes
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-56 animate-pulse rounded-xl border border-border bg-card/60"
              />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-6 text-center">
            <Ticket className="h-8 w-8 text-muted-foreground/60" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">No passes issued yet</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Discover university seminars, tech conferences, and workshops on the campus calendar.
            </p>
            <Link href="/events" className="mt-4">
              <Button size="sm" className="gap-1.5 text-xs">
                <Compass className="h-3.5 w-3.5" />
                Browse Events
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tickets.slice(0, 3).map((ticket) => (
              <TicketPass key={ticket.id} ticket={ticket} variant="compact" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
