"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMyEvents, useDeleteEvent } from "@/lib/query/events.query";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  PlusCircle,
  Trash2,
  ExternalLink,
  Loader2,
  Users,
  MapPin,
} from "lucide-react";

export default function OrganizerEventsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyEvents({ page, limit: 10 });
  const deleteMutation = useDeleteEvent();

  const events = data?.data ?? [];
  const pagination = data?.pagination;

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete or cancel "${title}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Managed Events
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View, inspect registrations, and manage lifecycle states for all your scheduled events.
          </p>
        </div>

        <Link href="/organizer/events/create">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Events Content */}
      {isLoading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-base font-semibold text-foreground">No events found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            You have not created any university events yet.
          </p>
          <Link href="/organizer/events/create" className="mt-5 inline-block">
            <Button size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Your First Event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-4">Event Details</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Capacity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
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
                      <td className="px-6 py-4">
                        <Link
                          href={`/events/${evt.slug}`}
                          className="font-semibold text-foreground hover:text-primary hover:underline"
                        >
                          {evt.title}
                        </Link>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{evt.location}</span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">{formattedDate}</p>
                        <p>{formattedTime}</p>
                      </td>

                      {/* Capacity */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {evt.registeredCount} / {evt.capacity}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {evt.remainingSeats} seats available
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
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

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/events/${evt.slug}`} target="_blank">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Public Page">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(evt.id, evt.title)}
                            title="Delete / Cancel Event"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <p className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
