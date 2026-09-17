"use client";

import React, { useState } from "react";
import { PublicHeader } from "@/components/layout/public-header";
import { EventFilters } from "@/components/events/event-filters";
import { EventCard } from "@/components/events/event-card";
import { useEvents } from "@/lib/query/events.query";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePusherChannel } from "@/hooks/use-pusher";

export default function EventsCatalogPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined,
  );
  const [isOnline, setIsOnline] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);

  // Real-time catalog synchronization across all browsers
  usePusherChannel("events", {
    "event:created": () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    "event:updated": () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    "event:status-changed": () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    "event:seat-update": () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    "event:deleted": () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useEvents({
    search: search || undefined,
    categoryId: selectedCategory,
    isOnline,
    page,
    limit: 12,
  });

  const events = data?.data ?? [];
  const pagination = data?.pagination;

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory(undefined);
    setIsOnline(undefined);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Banner */}
        <div className="mb-8 border-b border-border pb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
                <Calendar className="h-3.5 w-3.5" />
                University Events
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Explore Campus Events
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Discover workshops, guest lectures, hackathons, and seminars across all university departments.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mb-8 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <EventFilters
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            selectedCategory={selectedCategory}
            onCategoryChange={(cat) => {
              setSelectedCategory(cat);
              setPage(1);
            }}
            isOnline={isOnline}
            onFormatChange={(online) => {
              setIsOnline(online);
              setPage(1);
            }}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading upcoming events...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-destructive">Failed to load events.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          </div>
        )}

        {/* Events Grid */}
        {!isLoading && !isError && events.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
                <p className="text-xs text-muted-foreground">
                  Showing page <span className="font-semibold text-foreground">{pagination.page}</span> of{" "}
                  <span className="font-semibold text-foreground">{pagination.totalPages}</span> ({pagination.total} total events)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
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
          </>
        )}

        {/* Empty State */}
        {!isLoading && !isError && events.length === 0 && (
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">No events found</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              We couldn&apos;t find any events matching your search or filters. Try adjusting your search query or reset the filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-5"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
