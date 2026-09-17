"use client";

import React from "react";
import Link from "next/link";
import { useMyEvents } from "@/lib/query/events.query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  PlusCircle,
  QrCode,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function OrganizerDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useMyEvents({ page: 1, limit: 5 });

  const events = data?.data ?? [];
  const totalEvents = data?.pagination?.total ?? 0;
  const totalRegistrations = events.reduce(
    (acc, curr) => acc + curr.registeredCount,
    0,
  );

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
          <Link href="/organizer/events/create">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Total Events
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{totalEvents}</p>
          <span className="text-xs text-muted-foreground">Managed by your team</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Total Registrations
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{totalRegistrations}</p>
          <span className="text-xs text-muted-foreground">Enrolled student attendees</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Attendance System
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <QrCode className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-base font-semibold text-foreground">Live Scanner</p>
          <span className="text-xs text-muted-foreground">Instant check-in ready</span>
        </div>
      </div>

      {/* Recent Events Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Recent Events</h2>
            <p className="text-xs text-muted-foreground">
              Your latest scheduled workshops, seminars, and club activities
            </p>
          </div>
          <Link href="/organizer/events">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All Events
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Loading your events...
          </div>
        ) : events.length === 0 ? (
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
            {events.map((evt) => {
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
                  <div>
                    <Link
                      href={`/events/${evt.slug}`}
                      className="text-sm font-semibold text-foreground transition hover:text-primary"
                    >
                      {evt.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{dateStr}</span>
                      <span>&bull;</span>
                      <span>{evt.location}</span>
                      <span>&bull;</span>
                      <span>
                        {evt.registeredCount} / {evt.capacity} registered
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {evt.status}
                    </span>
                    <Link href={`/events/${evt.slug}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        View Details
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
