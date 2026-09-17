import React from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      {/* Background Subtle Grid Texture */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

      {/* Header Logo */}
      <div className="relative z-10 mb-8 flex items-center gap-2">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg border border-border/80 bg-card/80 px-4 py-2 text-foreground shadow-xs backdrop-blur-md transition hover:border-primary/50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Univent</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Campus
          </span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">{children}</div>

      {/* Footer Meta */}
      <div className="relative z-10 mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Univent Platform. Centralized University Event Management.
      </div>
    </div>
  );
}
