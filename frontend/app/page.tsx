"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Calendar,
  QrCode,
  ShieldCheck,
  Award,
  ArrowRight,
  Sparkles,
  Users,
  Building2,
  CheckCircle2,
  Ticket,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/lib/query/events.query";
import { EventCard } from "@/components/events/event-card";

export default function HomePage() {
  const { data: eventsData, isLoading } = useEvents({ page: 1, limit: 3 });
  const featuredEvents = eventsData?.data ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/60 py-16 sm:py-24 lg:py-32">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 blur-3xl opacity-20 pointer-events-none">
            <div className="aspect-[1155/678] w-[72rem] bg-gradient-to-tr from-primary to-violet-500" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Next-Generation University Event Platform</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Campus life, organized. <br />
                <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                  Digital passes, verified.
                </span>
              </h1>

              <p className="mt-6 text-base text-muted-foreground sm:text-lg leading-relaxed">
                Discover university conferences, workshops, and student activities with real-time seat reservation, cryptographic QR boarding passes, and automated attendance verification.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/events">
                  <Button size="lg" className="gap-2 h-11 px-6 font-semibold shadow-md">
                    <Calendar className="h-4 w-4" />
                    Explore Campus Events
                  </Button>
                </Link>
                <Link href="/student">
                  <Button variant="outline" size="lg" className="gap-2 h-11 px-6 font-semibold">
                    <Ticket className="h-4 w-4" />
                    My Student Passes
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Instant Cryptographic QR
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Zero Overbooking Guarantee
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Verified Attendance
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Pillars */}
        <section className="py-16 sm:py-20 border-b border-border/60 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Engineered for Modern Universities
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Built specifically for university faculties, student clubs, and campus administrators.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-primary/40 transition">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <QrCode className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Digital Boarding Passes
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Every attendee receives a uniquely hashed, tamper-resistant QR boarding pass that guarantees admission and prevents duplicate entries.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-primary/40 transition">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Concurrency-Safe Reservations
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  High-demand workshops and seminars are backed by Optimistic Concurrency Control, eliminating overbooking even during registration surges.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-primary/40 transition">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Live Scanner & Certificates
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Organizers scan entrance codes in real-time with automatic roster updates, live attendee counters, and automated certificate issuance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Events Showcase */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Featured Upcoming Events
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Discover what is happening on campus this week and reserve your seat.
                </p>
              </div>
              <Link href="/events">
                <Button variant="outline" className="gap-2 text-sm">
                  View Full Calendar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-80 animate-pulse rounded-xl border border-border bg-card/60"
                  />
                ))}
              </div>
            ) : featuredEvents.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-base font-semibold text-foreground">No events scheduled yet</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Check back soon for university symposiums, hackathons, and guest seminars.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-foreground">Univent Platform</span>
            <span>&copy; {new Date().getFullYear()} University Campus Network.</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/events" className="hover:text-foreground">
              Event Catalog
            </Link>
            <Link href="/organizer" className="hover:text-foreground">
              Organizer Console
            </Link>
            <Link href="/student" className="hover:text-foreground">
              Student Passes
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
