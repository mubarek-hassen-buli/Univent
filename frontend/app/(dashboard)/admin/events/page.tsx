"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminEvents, useUpdateEventStatus, useDeleteEvent } from "@/lib/query/events.query";
import { usePusherChannel } from "@/hooks/use-pusher";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Trash2,
  Loader2,
  Users,
  MapPin,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

type EventStatusFilter = "ALL" | "PUBLISHED" | "DRAFT" | "COMPLETED" | "CANCELLED";

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<EventStatusFilter>("ALL");
  const [page, setPage] = useState(1);

  const statusParam = selectedStatus === "ALL" ? undefined : selectedStatus;

  const { data, isLoading } = useAdminEvents({
    page,
    limit: 10,
    search: search || undefined,
    status: statusParam,
  });

  const updateStatusMutation = useUpdateEventStatus();
  const deleteMutation = useDeleteEvent();

  // Real-time synchronization
  usePusherChannel("events", {
    "event:created": () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
    "event:updated": () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
    "event:status-changed": () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
    "event:deleted": () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
    "registration:new": () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
    "registration:cancelled": () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
  });

  const events = data?.data ?? [];
  const pagination = data?.pagination;

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ eventId, status: newStatus });
    } catch {
      alert("Failed to update event status.");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to permanently delete event "${title}"?`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch {
        alert("Failed to delete event.");
      }
    }
  };

  const statusTabs: { label: string; value: EventStatusFilter }[] = [
    { label: "All Events", value: "ALL" },
    { label: "Published", value: "PUBLISHED" },
    { label: "Drafts", value: "DRAFT" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-destructive uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Global Administration
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Platform Event Directory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Audit, moderate lifecycle states, and monitor registrations across all university events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Live Sync
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                selectedStatus === tab.value
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
          />
        </div>
      </div>

      {/* Events Table */}
      {isLoading ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-destructive" />
          <p className="text-sm text-muted-foreground">Loading platform events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-base font-semibold text-foreground">No events found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {search || selectedStatus !== "ALL"
              ? "No events match your current filter parameters."
              : "No events have been created on the platform yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-5 py-3.5">Event</th>
                  <th className="px-5 py-3.5">Organizer</th>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-5 py-3.5">Capacity</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((evt) => {
                  const startDate = new Date(evt.startDate);
                  const formattedDate = startDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const formattedTime = startDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={evt.id} className="transition hover:bg-muted/20">
                      {/* Title & Location */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground">
                          {evt.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          {evt.category?.name && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                              {evt.category.name}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[180px]">
                              {evt.isOnline ? "Online" : evt.location}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Organizer */}
                      <td className="px-5 py-4 text-xs">
                        <p className="font-medium text-foreground">
                          {evt.organizer?.name || "Unknown"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {evt.organizer?.department || "Event Lead"}
                        </p>
                      </td>

                      {/* Date & Time */}
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">{formattedDate}</p>
                        <p>{formattedTime}</p>
                      </td>

                      {/* Capacity */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {evt.registeredCount} / {evt.capacity}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {evt.remainingSeats} remaining
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
                            evt.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : evt.status === "COMPLETED"
                                ? "bg-blue-500/10 text-blue-500"
                                : evt.status === "DRAFT"
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>

                      {/* Admin Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {evt.status === "DRAFT" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                              disabled={updateStatusMutation.isPending}
                              onClick={() => handleStatusChange(evt.id, "PUBLISHED")}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Publish
                            </Button>
                          )}
                          {evt.status === "PUBLISHED" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1 text-xs"
                                disabled={updateStatusMutation.isPending}
                                onClick={() => handleStatusChange(evt.id, "COMPLETED")}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Complete
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
                                disabled={updateStatusMutation.isPending}
                                onClick={() => handleStatusChange(evt.id, "CANCELLED")}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Cancel
                              </Button>
                            </>
                          )}
                          {evt.status === "CANCELLED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-xs"
                              disabled={updateStatusMutation.isPending}
                              onClick={() => handleStatusChange(evt.id, "PUBLISHED")}
                            >
                              <Clock className="h-3.5 w-3.5" />
                              Re-publish
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(evt.id, evt.title)}
                            disabled={deleteMutation.isPending}
                            title="Delete event"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
              <span>
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total events)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 gap-1 text-xs"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
