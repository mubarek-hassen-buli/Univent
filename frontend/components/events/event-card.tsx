import React from "react";
import Link from "next/link";
import { Calendar, MapPin, Users, Globe } from "lucide-react";
import type { EventItem } from "@/lib/query/events.query";

interface EventCardProps {
  event: EventItem;
}

export function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.startDate);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const seatPercentage = Math.min(
    Math.round((event.registeredCount / event.capacity) * 100),
    100,
  );

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      {/* Banner / Header Visual */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {event.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/60 p-4 text-center">
            <div className="rounded-lg border border-border/80 bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
              {event.category?.name || "Campus Event"}
            </div>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {event.category && (
            <span className="rounded-md bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur-xs">
              {event.category.name}
            </span>
          )}
          {event.isOnline ? (
            <span className="flex items-center gap-1 rounded-md bg-primary/90 px-2 py-0.5 text-[11px] font-medium text-primary-foreground backdrop-blur-xs">
              <Globe className="h-3 w-3" />
              Online
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-md bg-secondary/90 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground backdrop-blur-xs">
              <MapPin className="h-3 w-3" />
              In-Person
            </span>
          )}
        </div>

        {/* Sold Out Overlay */}
        {event.isSoldOut && (
          <div className="absolute top-3 right-3 rounded-md bg-destructive px-2 py-0.5 text-[11px] font-semibold text-destructive-foreground shadow-xs">
            Sold Out
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>
            {formattedDate} &bull; {formattedTime}
          </span>
        </div>

        <Link href={`/events/${event.slug}`}>
          <h3 className="line-clamp-1 text-base font-semibold tracking-tight text-foreground group-hover:text-primary">
            {event.title}
          </h3>
        </Link>

        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {event.description}
        </p>

        {/* Location or Online link */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{event.location}</span>
        </div>

        <div className="mt-auto pt-4">
          {/* Capacity Progress Bar */}
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              {event.registeredCount} / {event.capacity} registered
            </span>
            <span
              className={`font-semibold ${
                event.isSoldOut ? "text-destructive" : "text-primary"
              }`}
            >
              {event.remainingSeats} seats left
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-300 ${
                event.isSoldOut ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${seatPercentage}%` }}
            />
          </div>

          {/* Organizer & Action */}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                {event.organizer.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="max-w-[120px] truncate text-xs font-medium text-foreground">
                {event.organizer.department || event.organizer.name}
              </span>
            </div>

            <Link
              href={`/events/${event.slug}`}
              className="text-xs font-semibold text-primary transition hover:underline"
            >
              View Details &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
