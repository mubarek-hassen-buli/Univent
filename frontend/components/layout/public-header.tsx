"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, Calendar, User, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  const { user, isAuthenticated, role, logout } = useAuth();

  const dashboardPath =
    role === "admin"
      ? "/admin"
      : role === "organizer"
        ? "/organizer"
        : "/student";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Univent
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/events"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <Calendar className="h-4 w-4" />
            Explore Events
          </Link>
        </nav>

        {/* User Auth Buttons */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link href={dashboardPath}>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-3.5 w-3.5" />
                  <span>
                    {role === "organizer"
                      ? "Organizer Console"
                      : role === "admin"
                        ? "Admin Portal"
                        : "My Tickets"}
                  </span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="gap-1.5">
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
