"use client";

import React, { use } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  Download,
  Calendar,
  Building,
  User,
  ExternalLink,
  GraduationCap,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { useVerifyCertificate } from "@/lib/query/certificates.query";

interface VerifyPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function CertificateVerificationPage({
  params,
}: VerifyPageProps) {
  const { code } = use(params);
  const { data: cert, isLoading, isError } = useVerifyCertificate(code);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const pdfDownloadUrl = `${apiBaseUrl}/certificates/code/${code}/pdf`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <PublicHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Verifying credential authenticity against university registry...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-10 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumb */}
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Event Catalog
          </Link>

          {/* Invalid / Not Found State */}
          {isError || !cert ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center sm:p-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Credential Verification Failed
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                No verified certificate record was found matching credential code{" "}
                <span className="font-mono font-bold text-destructive">
                  {code}
                </span>
                . This credential may be forged, invalid, or expired.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href="/">
                  <Button variant="outline" size="sm">
                    Return to Univent Home
                  </Button>
                </Link>
                <Link href="/events">
                  <Button size="sm">Explore Verified Campus Events</Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Valid Verified Certificate State */
            <div className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-card p-6 shadow-xl sm:p-10">
              {/* Authenticity Banner Header */}
              <div className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Authentic Credential Verified
                    </span>
                    <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      Certificate of Participation
                    </h1>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Credential ID
                  </span>
                  <p className="font-mono text-sm font-bold text-primary">
                    {cert.certificateCode}
                  </p>
                </div>
              </div>

              {/* Recipient Information */}
              <div className="py-6 border-b border-border/80 space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Presented To
                </span>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                      {cert.student.name}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {cert.student.department
                        ? `Department of ${cert.student.department}`
                        : "University Student"}
                      {cert.student.studentId ? ` • ID: ${cert.student.studentId}` : ""}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    Issued {new Date(cert.issuedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Event Information */}
              <div className="py-6 space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Event Completed
                </span>
                <div className="rounded-xl bg-muted/40 p-5 border border-border/60 space-y-3">
                  <h3 className="text-lg font-bold text-foreground sm:text-xl">
                    {cert.event.title}
                  </h3>

                  <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>
                        {new Date(cert.event.startDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>
                        Organized by {cert.organizer.name}
                        {cert.organizer.department ? ` (${cert.organizer.department})` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Stamp Notice */}
              <div className="rounded-xl bg-emerald-500/5 p-4 border border-emerald-500/20 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  This official academic credential was issued following cryptographic optical QR check-in verification at the event entrance. The certificate authenticity has been confirmed by the Univent Campus Network registry.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
                <Link href={`/events/${cert.event.slug}`}>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Event Details
                  </Button>
                </Link>

                <div className="flex items-center gap-3">
                  <a href={pdfDownloadUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="gap-2 font-semibold shadow-md">
                      <Download className="h-4 w-4" />
                      Download Official PDF
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
