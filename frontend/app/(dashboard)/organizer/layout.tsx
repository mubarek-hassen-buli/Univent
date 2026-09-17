"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OrganizerNav } from "@/components/layout/organizer-nav";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isApproved, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user && role === "organizer" && !isApproved) {
        router.push("/pending-approval");
      }
    }
  }, [user, isApproved, role, isLoading, router]);

  if (!isLoading && user && role === "organizer" && !isApproved) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OrganizerNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
