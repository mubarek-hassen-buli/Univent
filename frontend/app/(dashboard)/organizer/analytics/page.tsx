"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Calendar,
  CheckCircle2,
  QrCode,
  ExternalLink,
  Loader2,
  PieChart,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrganizerAnalytics } from "@/lib/query/analytics.query";
import { useAuth } from "@/hooks/use-auth";
import { usePusherChannel } from "@/hooks/use-pusher";
import { useQueryClient } from "@tanstack/react-query";
import { ChartBarInteractive } from "@/components/analytics/chart-bar-interactive";
import { ChartPieDonutActive } from "@/components/analytics/chart-pie-donut-active";
import { ChartRadialStacked } from "@/components/analytics/chart-radial-stacked";

export default function OrganizerAnalyticsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: analytics, isLoading, isError, refetch } =
    useOrganizerAnalytics();

  // Real-time synchronization for analytics & turnout metrics
  usePusherChannel(user?.id ? `organizer-${user.id}` : null, {
    "registration:new": () => {
      queryClient.invalidateQueries({ queryKey: ["organizer-analytics"] });
    },
    "registration:cancelled": () => {
      queryClient.invalidateQueries({ queryKey: ["organizer-analytics"] });
    },
    "attendance:checked-in": () => {
      queryClient.invalidateQueries({ queryKey: ["organizer-analytics"] });
    },
    "event:created": () => {
      queryClient.invalidateQueries({ queryKey: ["organizer-analytics"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Calculating turnout analytics and event performance metrics...
        </p>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center text-destructive">
        <p className="font-semibold">Unable to load event analytics</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Please check your connection and try again.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Turnout & Attendance Analytics
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Live Intelligence
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor real-time participant turnout, event occupancy rates, and entrance check-in velocity.
          </p>
        </div>

        <Link href="/organizer/events">
          <Button variant="outline" size="sm">
            &larr; Back to Events Table
          </Button>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Events */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Events
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-foreground">
              {analytics.totalEvents}
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Across all categories
            </p>
          </div>
        </div>

        {/* Total Registrations */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Registrations
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-foreground">
              {analytics.totalRegistrations}
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Occupancy: {analytics.overallOccupancyRate}% of {analytics.totalCapacity} seats
            </p>
          </div>
        </div>

        {/* Total Attendees */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Admitted Attendees
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-foreground">
              {analytics.totalAttended}
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Scanned entrance check-ins
            </p>
          </div>
        </div>

        {/* Overall Turnout Rate */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Average Turnout Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-primary">
              {analytics.overallAttendanceRate}%
            </span>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(analytics.overallAttendanceRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chart 1: Interactive Bar Chart (30-day velocity with real data) */}
      <ChartBarInteractive
        title="Event Registration & Check-in Velocity"
        description="Daily participant ticket registrations vs verified entrance check-ins over the past 30 days"
        data={analytics.timeline || []}
        totalRegistrations={analytics.totalRegistrations}
        totalAttendance={analytics.totalAttended}
      />

      {/* Visual Analytics Row: Donut Active + Radial Stacked */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Chart 2: Donut Active Sector (Event Portfolio Breakdown) */}
        <ChartPieDonutActive
          title="Portfolio Status & Category Distribution"
          description="Lifecycle status and category volume for your organized events"
          data={
            [
              { name: "Published", value: analytics.statusDistribution?.published || 0 },
              { name: "Completed", value: analytics.statusDistribution?.completed || 0 },
              { name: "Drafts", value: analytics.statusDistribution?.draft || 0 },
              { name: "Cancelled", value: analytics.statusDistribution?.cancelled || 0 },
            ].filter((i) => i.value > 0).length > 0
              ? [
                  { name: "Published", value: analytics.statusDistribution?.published || 0 },
                  { name: "Completed", value: analytics.statusDistribution?.completed || 0 },
                  { name: "Drafts", value: analytics.statusDistribution?.draft || 0 },
                  { name: "Cancelled", value: analytics.statusDistribution?.cancelled || 0 },
                ].filter((i) => i.value > 0)
              : (analytics.categoryDistribution || []).map((c) => ({
                  name: c.name,
                  value: c.eventCount,
                }))
          }
          footerDescription="Active portfolio management breakdown"
        />

        {/* Chart 3: Radial Stacked (Turnout & Attendance Gauge) */}
        <ChartRadialStacked
          title="Turnout & Attendance Gauge"
          description="Admitted attendees vs pending registered participants"
          attended={analytics.totalAttended}
          totalRegistrations={analytics.totalRegistrations}
          turnoutRate={analytics.overallAttendanceRate}
          footerDescription="Entrance check-in fulfillment across your events"
        />
      </div>

      {/* Event Breakdown Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            Per-Event Attendance Breakdown
          </h2>
          <span className="text-xs text-muted-foreground">
            {analytics.eventPerformance.length} events analyzed
          </span>
        </div>

        {analytics.eventPerformance.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            No events available for analysis.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Registrations</th>
                    <th className="px-6 py-4">Turnout Rate</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {analytics.eventPerformance.map((evt) => (
                    <tr key={evt.id} className="hover:bg-muted/20 transition">
                      <td className="px-6 py-4 font-semibold text-foreground">
                        <Link
                          href={`/events/${evt.slug}`}
                          className="hover:text-primary hover:underline"
                        >
                          {evt.title}
                        </Link>
                        <p className="text-xs font-normal text-muted-foreground">
                          {new Date(evt.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                          {evt.category}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                            evt.status === "PUBLISHED"
                              ? "bg-primary/10 text-primary"
                              : evt.status === "COMPLETED"
                                ? "bg-muted text-muted-foreground"
                                : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        <span className="font-semibold text-foreground">
                          {evt.registeredCount}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          / {evt.capacity} seats
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="w-36 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground">
                              {evt.attendedCount} attended
                            </span>
                            <span className="font-semibold text-primary">
                              {evt.attendanceRate}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${Math.min(evt.attendanceRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/organizer/events/${evt.id}/scanner`}>
                            <Button
                              size="xs"
                              variant="outline"
                              className="gap-1 text-xs text-primary border-primary/30 hover:bg-primary/10"
                            >
                              <QrCode className="h-3 w-3" />
                              Scanner
                            </Button>
                          </Link>
                          <Link href={`/events/${evt.slug}`} target="_blank">
                            <Button size="xs" variant="ghost" className="h-7 w-7 p-0">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
