"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, Ticket, Award, Compass, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/notification-bell";

export function StudentNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = [
    {
      label: "Overview",
      href: "/student",
      icon: LayoutDashboard,
      active: pathname === "/student",
    },
    {
      label: "My Passes",
      href: "/student/tickets",
      icon: Ticket,
      active: pathname.startsWith("/student/tickets"),
    },
    {
      label: "Certificates",
      href: "/student/certificates",
      icon: Award,
      active: pathname.startsWith("/student/certificates"),
    },
    {
      label: "Browse Events",
      href: "/events",
      icon: Compass,
      active: pathname === "/events",
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Portal Badge */}
        <div className="flex items-center gap-3">
          <Link href="/student" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Univent
            </span>
          </Link>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary uppercase tracking-wider">
            Student Portal
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden items-center gap-1 sm:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={link.active ? "secondary" : "ghost"}
                  size="sm"
                  className={`gap-1.5 text-xs font-medium ${
                    link.active ? "text-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Student Profile Info & Actions */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-foreground">
              {user?.name || "Student"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {user?.studentId
                ? `ID: ${user.studentId}`
                : user?.department || "Enrolled Student"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="gap-1.5 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
