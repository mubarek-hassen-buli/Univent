"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  Search,
  Compass,
  GraduationCap,
  Sparkles,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyCertificates } from "@/lib/query/certificates.query";
import { CertificateCard } from "@/components/certificates/certificate-card";

export default function StudentCertificatesPage() {
  const { data: certificates = [], isLoading, isError, refetch } =
    useMyCertificates();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCertificates = certificates.filter((cert) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = cert.event.title.toLowerCase().includes(q);
    const codeMatch = cert.certificateCode.toLowerCase().includes(q);
    const categoryMatch = cert.event.category.toLowerCase().includes(q);
    return titleMatch || codeMatch || categoryMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              My Verified Certificates
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {certificates.length} Earned
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Official academic credentials awarded for verified attendance at university seminars and workshops.
          </p>
        </div>

        <Link href="/events">
          <Button className="gap-2">
            <Compass className="h-4 w-4" />
            Explore More Events
          </Button>
        </Link>
      </div>

      {/* Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>All certificates include cryptographic verification QR codes</span>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 animate-pulse rounded-2xl border border-border bg-card/60"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
          <p className="font-semibold">Unable to load your certificates</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Please check your network connection and try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            Retry
          </Button>
        </div>
      )}

      {/* Certificates Grid */}
      {!isLoading && !isError && filteredCertificates.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCertificates.map((certificate) => (
            <CertificateCard key={certificate.id} certificate={certificate} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredCertificates.length === 0 && (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Award className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            {searchQuery ? "No matching certificates found" : "No certificates earned yet"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {searchQuery
              ? "Try searching by a different event title or certificate code."
              : "Attend campus workshops, conferences, and seminars and get scanned at the entrance to earn official verified certificates."}
          </p>
          <div className="mt-6">
            {searchQuery ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            ) : (
              <Link href="/events">
                <Button size="sm" className="gap-2">
                  <Compass className="h-4 w-4" />
                  Browse Campus Events
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
