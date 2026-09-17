"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Ticket,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Compass,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyTickets, useRegisterEvent, type TicketItem } from "@/lib/query/registrations.query";
import { TicketPass } from "@/components/tickets/ticket-pass";
import { useAuth } from "@/hooks/use-auth";
import { usePusherChannel } from "@/hooks/use-pusher";
import { useQueryClient } from "@tanstack/react-query";

type FilterTab = "all" | "upcoming" | "attended" | "cancelled";

function TicketsContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const registerEventId = searchParams.get("register");

  const { data: tickets = [], isLoading, isError, refetch } = useMyTickets();
  const registerMutation = useRegisterEvent();

  const [activeTab, setActiveTab] = useState<FilterTab>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [registrationNotice, setRegistrationNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const registeredEventRef = useRef<string | null>(null);

  // Real-time synchronization for student tickets
  usePusherChannel(user?.id ? `user-${user.id}` : null, {
    "ticket:attended": (data: unknown) => {
      const payload = data as { eventTitle?: string };
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      setRegistrationNotice({
        type: "success",
        message: payload?.eventTitle
          ? `Attendance confirmed for "${payload.eventTitle}"! Your pass is now marked as attended.`
          : "Pass verified at entrance! Attendance confirmed in real time.",
      });
    },
    "notification:new": () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
  });

  // Auto-trigger registration when redirected with ?register=[eventId]
  useEffect(() => {
    if (!registerEventId) return;

    // Prevent duplicate triggers in StrictMode or fast re-renders
    if (registeredEventRef.current === registerEventId) return;
    registeredEventRef.current = registerEventId;

    // If user already has this ticket in cache/state
    const alreadyRegistered = tickets.some(
      (t) => t.event.id === registerEventId && t.status === "CONFIRMED",
    );
    if (alreadyRegistered) {
      setRegistrationNotice({
        type: "success",
        message: "You are already registered for this event. Your active boarding pass is displayed below.",
      });
      router.replace("/student/tickets", { scroll: false });
      return;
    }

    registerMutation.mutate(registerEventId, {
      onSuccess: (data) => {
        setRegistrationNotice({
          type: "success",
          message: `Seat confirmed for "${data.event.title}"! Your digital boarding pass has been issued.`,
        });
        // Clean URL without register param
        router.replace("/student/tickets", { scroll: false });
        refetch();
      },
      onError: (err: unknown) => {
        const errorObj = err as {
          response?: { status?: number; data?: { message?: string | string[] } };
          statusCode?: number;
          message?: string;
        };
        const status = errorObj.statusCode || errorObj.response?.status;
        const rawMsg = errorObj.response?.data?.message || errorObj.message;
        const msgStr = Array.isArray(rawMsg) ? rawMsg.join(", ") : rawMsg || "";

        // If 409 conflict because already registered
        if (status === 409 || msgStr.toLowerCase().includes("already registered")) {
          setRegistrationNotice({
            type: "success",
            message: "Seat confirmed! You already have an active reservation for this event.",
          });
          refetch();
        } else {
          setRegistrationNotice({
            type: "error",
            message: msgStr || "Unable to reserve ticket. The event may be sold out.",
          });
        }
        router.replace("/student/tickets", { scroll: false });
      },
    });
  }, [registerEventId, tickets, registerMutation, refetch, router]);

  // Filtered tickets
  const filteredTickets = tickets.filter((ticket) => {
    // Tab filter
    if (activeTab === "upcoming") {
      if (ticket.status === "CANCELLED" || ticket.hasAttended) return false;
    } else if (activeTab === "attended") {
      if (!ticket.hasAttended) return false;
    } else if (activeTab === "cancelled") {
      if (ticket.status !== "CANCELLED") return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ticket.event.title.toLowerCase().includes(q);
      const matchCode = ticket.registrationCode.toLowerCase().includes(q);
      const matchLocation = ticket.event.location.toLowerCase().includes(q);
      return matchTitle || matchCode || matchLocation;
    }

    return true;
  });

  const upcomingCount = tickets.filter(
    (t) => t.status === "CONFIRMED" && !t.hasAttended,
  ).length;
  const attendedCount = tickets.filter((t) => t.hasAttended).length;
  const cancelledCount = tickets.filter((t) => t.status === "CANCELLED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Event Passes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your digital tickets, live QR access codes, and verified attendance records.
          </p>
        </div>
        <Link href="/events">
          <Button className="gap-2">
            <Compass className="h-4 w-4" />
            Explore More Events
          </Button>
        </Link>
      </div>

      {/* Auto-Registration Pending State */}
      {registerMutation.isPending && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-primary">
          <Loader2 className="h-5 w-5 animate-spin shrink-0" />
          <p className="text-sm font-medium">
            Reserving your seat with concurrency protection and generating cryptographic pass...
          </p>
        </div>
      )}

      {/* Registration Feedback Notice */}
      {registrationNotice && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${
            registrationNotice.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-destructive/20 bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {registrationNotice.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            )}
            <span>{registrationNotice.message}</span>
          </div>
          <button
            onClick={() => setRegistrationNotice(null)}
            className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={activeTab === "upcoming" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setActiveTab("upcoming")}
            className="text-xs font-medium"
          >
            Active & Upcoming ({upcomingCount})
          </Button>
          <Button
            variant={activeTab === "all" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setActiveTab("all")}
            className="text-xs font-medium"
          >
            All Passes ({tickets.length})
          </Button>
          <Button
            variant={activeTab === "attended" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setActiveTab("attended")}
            className="text-xs font-medium"
          >
            Attended ({attendedCount})
          </Button>
          <Button
            variant={activeTab === "cancelled" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setActiveTab("cancelled")}
            className="text-xs font-medium"
          >
            Cancelled ({cancelledCount})
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search passes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 animate-pulse rounded-xl border border-border bg-card/60"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
          <p className="font-semibold">Unable to load event passes</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Please check your connection and try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            Retry
          </Button>
        </div>
      )}

      {/* Tickets Grid */}
      {!isLoading && !isError && filteredTickets.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((ticket) => (
            <TicketPass
              key={ticket.id}
              ticket={ticket}
              variant="compact"
              onCancelled={() => refetch()}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredTickets.length === 0 && (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Ticket className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            {searchQuery
              ? "No matching passes found"
              : activeTab === "upcoming"
                ? "No upcoming event passes"
                : activeTab === "attended"
                  ? "No attended events yet"
                  : activeTab === "cancelled"
                    ? "No cancelled passes"
                    : "No event passes issued"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search query or clear the filter."
              : "Explore the university calendar to register for upcoming seminars, workshops, and campus activities."}
          </p>
          <div className="mt-6 flex items-center gap-3">
            {searchQuery ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            ) : (
              <Link href="/events">
                <Button size="sm" className="gap-2">
                  <Compass className="h-4 w-4" />
                  Browse Campus Events
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <TicketsContent />
    </Suspense>
  );
}
