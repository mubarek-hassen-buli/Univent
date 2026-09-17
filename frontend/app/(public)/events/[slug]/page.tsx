"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { PublicHeader } from "@/components/layout/public-header";
import { useEvent } from "@/lib/query/events.query";
import { useAuth } from "@/hooks/use-auth";
import { getPusherClient } from "@/lib/pusher/pusher-client";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Users,
  Building,
  ArrowLeft,
  Loader2,
  Ticket,
  CheckCircle2,
  Radio,
} from "lucide-react";

interface EventDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = use(params);
  const queryClient = useQueryClient();
  const { data: event, isLoading, isError } = useEvent(slug);
  const { isAuthenticated, isStudent } = useAuth();

  const [liveSeats, setLiveSeats] = useState<{
    remainingSeats: number;
    registeredCount: number;
    isSoldOut: boolean;
  } | null>(null);

  useEffect(() => {
    if (!event?.id) return;
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `event-${event.id}`;
    const channel = pusher.subscribe(channelName);

    channel.bind(
      "event:seat-update",
      (data: {
        eventId: string;
        registeredCount: number;
        capacity: number;
        remainingSeats: number;
        isSoldOut: boolean;
      }) => {
        if (data.eventId === event.id) {
          setLiveSeats({
            remainingSeats: data.remainingSeats,
            registeredCount: data.registeredCount,
            isSoldOut: data.isSoldOut,
          });
          queryClient.invalidateQueries({ queryKey: ["events", slug] });
        }
      },
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [event?.id, slug, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <PublicHeader />
        <div className="flex min-h-[500px] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <PublicHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-foreground">Event Not Found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The event you are looking for does not exist or may have been removed.
          </p>
          <Link href="/events" className="mt-6 inline-block">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to All Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  const formattedStartDate = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
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

  const effectiveRemainingSeats =
    liveSeats !== null ? liveSeats.remainingSeats : event.remainingSeats;
  const effectiveRegisteredCount =
    liveSeats !== null ? liveSeats.registeredCount : event.registeredCount;
  const effectiveIsSoldOut =
    liveSeats !== null ? liveSeats.isSoldOut : event.isSoldOut;

  const seatPercentage = Math.min(
    Math.round((effectiveRegisteredCount / event.capacity) * 100),
    100,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Event Catalog
          </Link>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content (2 Columns) */}
          <div className="space-y-8 lg:col-span-2">
            {/* Banner Image */}
            {event.bannerUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.bannerUrl}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Badges & Title */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {event.category && (
                  <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {event.category.name}
                  </span>
                )}
                {event.isOnline ? (
                  <span className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    Online Event
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    In-Person
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {event.title}
              </h1>
            </div>

            {/* Event Time & Location Summary */}
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Date</h4>
                  <p className="text-sm font-medium text-foreground">{formattedStartDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Time</h4>
                  <p className="text-sm font-medium text-foreground">
                    {formattedStartTime} &ndash; {formattedEndTime}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-span-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Location</h4>
                  <p className="text-sm font-medium text-foreground">{event.location}</p>
                  {event.isOnline && event.meetingLink && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Access link will be unlocked upon ticket confirmation.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold text-foreground">About This Event</h2>
              <div className="mt-4 prose prose-sm max-w-none text-muted-foreground whitespace-pre-line leading-relaxed">
                {event.description}
              </div>
            </div>

            {/* Organizer Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold text-foreground">Organized By</h2>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                  {event.organizer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{event.organizer.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building className="h-3 w-3" />
                    <span>{event.organizer.department || "University Faculty/Club"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Registration Action Trigger (1 Column) */}
          <div className="space-y-6">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6 shadow-xs">
              <h3 className="text-base font-semibold text-foreground">Ticket Reservation</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Free for enrolled university students and faculty members
              </p>

              {/* Seat Capacity Progress */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Available Seats
                    {liveSeats !== null && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                        <Radio className="h-2.5 w-2.5 animate-pulse" />
                        Live
                      </span>
                    )}
                  </span>
                  <span
                    className={`font-semibold ${
                      effectiveIsSoldOut ? "text-destructive" : "text-primary"
                    }`}
                  >
                    {effectiveRemainingSeats} left of {event.capacity}
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all duration-300 ${
                      effectiveIsSoldOut ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{ width: `${seatPercentage}%` }}
                  />
                </div>
              </div>

              {/* Registration Call To Action */}
              <div className="mt-6">
                {effectiveIsSoldOut ? (
                  <Button disabled className="w-full justify-center gap-2">
                    Event Sold Out
                  </Button>
                ) : !isAuthenticated ? (
                  <Link href="/login" className="block w-full">
                    <Button className="w-full justify-center gap-2">
                      <Ticket className="h-4 w-4" />
                      Sign In to Register
                    </Button>
                  </Link>
                ) : (
                  <Link
                    href={`/student/tickets?register=${event.id}`}
                    className="block w-full"
                  >
                    <Button className="w-full justify-center gap-2">
                      <Ticket className="h-4 w-4" />
                      Register for Event Pass
                    </Button>
                  </Link>
                )}
              </div>

              {/* Perks / Guarantees */}
              <div className="mt-6 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span>Instant digital QR boarding ticket</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span>Verified attendance certificate PDF</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span>Cancel anytime before event starts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
