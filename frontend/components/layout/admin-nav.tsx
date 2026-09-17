"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, LayoutDashboard, Calendar, Users, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/notification-bell";

export function AdminNav() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navLinks = [
    {
      label: "Platform Command",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      label: "All Events",
      href: "/admin/events",
      icon: Calendar,
      active: pathname.startsWith("/admin/events"),
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Console Badge */}
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive text-destructive-foreground shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Univent
            </span>
          </Link>
          <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive uppercase tracking-wider">
            Admin Console
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

        {/* User Status & Notifications */}
        <div className="flex items-center gap-2.5">
          <NotificationBell />
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
