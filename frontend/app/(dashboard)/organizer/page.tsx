"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useOrganizerAnalytics } from "@/lib/query/analytics.query";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  PlusCircle,
  QrCode,
  ArrowRight,
  Sparkles,
  BarChart3,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export default function OrganizerDashboardPage() {
  const { user } = useAuth();
  const { data: analytics, isLoading } = useOrganizerAnalytics();

  const totalEvents = analytics?.totalEvents ?? 0;
  const totalRegistrations = analytics?.totalRegistrations ?? 0;
  const totalAttended = analytics?.totalAttended ?? 0;
  const attendanceRate = analytics?.overallAttendanceRate ?? 0;
  const occupancyRate = analytics?.overallOccupancyRate ?? 0;
  const topEvents = analytics?.eventPerformance?.slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Organizer Workspace
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name || "Organizer"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your university department events, view registrations, and launch live QR scanners.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <Link href="/organizer/analytics">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Link href="/organizer/events/create">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Total Events
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {isLoading ? "..." : totalEvents}
          </p>
          <span className="text-xs text-muted-foreground">Managed by your team</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Registrations
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {isLoading ? "..." : totalRegistrations}
          </p>
          <span className="text-xs text-muted-foreground">
            {occupancyRate}% seat occupancy
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Verified Attendance
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {isLoading ? "..." : totalAttended}
          </p>
          <span className="text-xs text-muted-foreground">
            {attendanceRate}% turnout rate
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Entrance Gate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <QrCode className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-base font-semibold text-foreground">Live QR Scanner</p>
          <span className="text-xs text-muted-foreground">Real-time check-in sync</span>
        </div>
      </div>

      {/* Recent Performance Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Event Performance</h2>
            <p className="text-xs text-muted-foreground">
              Overview of your recent events and attendee conversion
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/organizer/analytics">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Detailed Analytics
                <TrendingUp className="h-3 w-3" />
              </Button>
            </Link>
            <Link href="/organizer/events">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                All Events
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Loading your performance metrics...
          </div>
        ) : topEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No events organized yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Get started by creating your first university event.
            </p>
            <Link href="/organizer/events/create" className="mt-4 inline-block">
              <Button size="sm" className="gap-1.5">
                <PlusCircle className="h-3.5 w-3.5" />
                Create First Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {topEvents.map((evt) => {
              const dateStr = new Date(evt.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <div
                  key={evt.id}
                  className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/events/${evt.slug}`}
                        className="text-sm font-semibold text-foreground transition hover:text-primary"
                      >
                        {evt.title}
                      </Link>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {evt.category}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{dateStr}</span>
                      <span>&bull;</span>
                      <span>
                        {evt.registeredCount} / {evt.capacity} registered
                      </span>
                      <span>&bull;</span>
                      <span className="text-foreground font-medium">
                        {evt.attendedCount} attended ({evt.attendanceRate}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/organizer/events/${evt.id}/scanner`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <QrCode className="h-3.5 w-3.5" />
                        Scan
                      </Button>
                    </Link>
                    <Link href={`/events/${evt.slug}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
