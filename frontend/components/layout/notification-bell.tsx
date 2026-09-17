"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  Ticket,
  CheckCircle2,
  Award,
  Radio,
  ExternalLink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  useMyNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationItem,
} from "@/lib/query/notifications.query";
import { getPusherClient } from "@/lib/pusher/pusher-client";

export function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, refetch } = useMyNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  // Real-time notification subscription via Pusher
  useEffect(() => {
    if (!user?.id) return;
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `user-${user.id}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("notification:new", () => {
      refetch();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [user?.id, refetch]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      await markReadMutation.mutateAsync(notif.id);
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "REGISTRATION":
        return <Ticket className="h-4 w-4 text-emerald-500" />;
      case "ATTENDANCE":
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case "CERTIFICATE":
        return <Award className="h-4 w-4 text-amber-500" />;
      case "ANNOUNCEMENT":
        return <Radio className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-8 w-8 p-0"
        title="Notifications"
      >
        <Bell className="h-4 w-4 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notification List */}
          <div className="mt-2 max-h-[320px] overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Bell className="mx-auto h-7 w-7 opacity-30 mb-2" />
                <p>No notifications right now.</p>
                <p className="text-[11px] text-muted-foreground/70">
                  Updates on passes and attendance will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const formattedTime = new Date(
                  notif.createdAt,
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                });

                const content = (
                  <div
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-3 p-2.5 rounded-xl transition cursor-pointer ${
                      notif.read
                        ? "opacity-75 hover:bg-muted/30"
                        : "bg-primary/5 hover:bg-primary/10"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                        {formattedTime}
                      </span>
                    </div>
                  </div>
                );

                return notif.link ? (
                  <Link key={notif.id} href={notif.link}>
                    {content}
                  </Link>
                ) : (
                  <div key={notif.id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
