"use client";

import { useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher/pusher-client";

type EventHandler<T = unknown> = (data: T) => void;

/**
 * Subscribes to a Pusher channel and listens to multiple events with automatic lifecycle cleanup.
 *
 * @param channelName The name of the Pusher channel (e.g. `events`, `user-123`, `event-456`), or null/undefined to skip.
 * @param events An object mapping event names to their callback handlers.
 */
export function usePusherChannel(
  channelName: string | null | undefined,
  events: Record<string, EventHandler<unknown>>,
) {
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!channelName) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(channelName);

    const handlers: Record<string, (data: unknown) => void> = {};

    Object.keys(eventsRef.current).forEach((eventName) => {
      const handler = (data: unknown) => {
        const currentHandler = eventsRef.current[eventName];
        if (currentHandler) {
          currentHandler(data);
        }
      };
      handlers[eventName] = handler;
      channel.bind(eventName, handler);
    });

    return () => {
      Object.keys(handlers).forEach((eventName) => {
        channel.unbind(eventName, handlers[eventName]);
      });
      pusher.unsubscribe(channelName);
    };
  }, [channelName]);
}

/**
 * Convenience hook to subscribe to a single Pusher event on a channel.
 */
export function usePusherEvent<T = unknown>(
  channelName: string | null | undefined,
  eventName: string,
  callback: EventHandler<T>,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!channelName || !eventName) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(channelName);

    const handler = (data: T) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    channel.bind(eventName, handler);

    return () => {
      channel.unbind(eventName, handler);
      pusher.unsubscribe(channelName);
    };
  }, [channelName, eventName]);
}
