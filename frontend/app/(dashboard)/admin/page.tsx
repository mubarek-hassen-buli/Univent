"use client";

import React from "react";
import Link from "next/link";
import { useAdminAnalytics } from "@/lib/query/analytics.query";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  Award,
  CheckCircle2,
  Tag,
  ShieldCheck,
  ExternalLink,
  Activity,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data: analytics, isLoading, error } = useAdminAnalytics();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Activity className="h-6 w-6 animate-pulse text-destructive" />
          <p className="text-sm">Aggregating platform telemetry...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
        <p className="text-sm font-semibold">Failed to load platform analytics.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Please check your admin permissions or try again.
        </p>
      </div>
    );
  }

  const { overview, eventsByStatus, categoryDistribution, recentActivity } = analytics;

  return (
    <div className="space-y-8">
      {/* Platform Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-destructive uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            Platform Command Center
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            System Telemetry & Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time platform usage, university engagement rates, and credential issuance audit.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Live Sync Active
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Total Users
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {overview.totalUsers}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{overview.totalStudents} students</span>
            <span>&bull;</span>
            <span>{overview.totalOrganizers} organizers</span>
            <span>&bull;</span>
            <span className="text-destructive font-medium">{overview.totalAdmins} admins</span>
          </div>
        </div>

        {/* Total Events */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Platform Events
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {overview.totalEvents}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-emerald-500">
              {overview.publishedEvents} published
            </span>
            <span>&bull;</span>
            <span>{eventsByStatus.draft} drafts</span>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Turnout Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {overview.platformAttendanceRate}%
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{overview.totalAttendance} checked in</span>
            <span>/</span>
            <span>{overview.totalRegistrations} registered</span>
          </div>
        </div>

        {/* Certificates */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Issued Credentials
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {overview.totalCertificates}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Verified PDF certificates</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Events by Status & Category Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Status Distribution */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Events by Status</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <span className="text-xs font-medium text-foreground">Published & Active</span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                {eventsByStatus.published}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <span className="text-xs font-medium text-foreground">Completed</span>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-500">
                {eventsByStatus.completed}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <span className="text-xs font-medium text-foreground">Drafts Pending</span>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500">
                {eventsByStatus.draft}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <span className="text-xs font-medium text-foreground">Cancelled</span>
              <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                {eventsByStatus.cancelled}
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">Category Popularity</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {categoryDistribution.length} active categories
            </span>
          </div>

          {categoryDistribution.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No categories configured yet.
            </div>
          ) : (
            <div className="space-y-3">
              {categoryDistribution.map((cat) => {
                const percentage = overview.totalEvents > 0
                  ? Math.round((cat.eventCount / overview.totalEvents) * 100)
                  : 0;
                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{cat.name}</span>
                      <span className="text-muted-foreground">
                        {cat.eventCount} events ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Platform Stream */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Latest Events */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Recent Events</h2>
            <Link href="/events">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View All
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          {recentActivity.latestEvents.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No events recorded.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentActivity.latestEvents.map((evt) => (
                <div key={evt.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0 pr-3">
                    <Link
                      href={`/events/${evt.slug}`}
                      className="truncate text-xs font-semibold text-foreground hover:text-primary transition"
                    >
                      {evt.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      Organized by {evt.organizerName} &bull; {new Date(evt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                    {evt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Issued Certificates */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Recent Credentials Issued</h2>
            <span className="text-xs text-muted-foreground">Verification Ledger</span>
          </div>

          {recentActivity.latestCertificates.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No certificates issued yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {recentActivity.latestCertificates.map((cert) => (
                <div key={cert.certificateCode} className="flex items-center justify-between py-3">
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-semibold text-foreground">
                      {cert.studentName}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {cert.eventTitle} &bull; {new Date(cert.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/verify/${cert.certificateCode}`}
                    target="_blank"
                    className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                  >
                    {cert.certificateCode}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
