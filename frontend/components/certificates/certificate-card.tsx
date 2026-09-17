"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  Download,
  ExternalLink,
  Check,
  Copy,
  Calendar,
  Building,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentCertificateItem } from "@/lib/query/certificates.query";

interface CertificateCardProps {
  certificate: StudentCertificateItem;
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const [copied, setCopied] = useState(false);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const pdfDownloadUrl = `${apiBaseUrl}/certificates/code/${certificate.certificateCode}/pdf`;
  const publicVerifyUrl = `/verify/${certificate.certificateCode}`;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const fullUrl = `${window.location.origin}${publicVerifyUrl}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedIssueDate = new Date(certificate.issuedAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-200 hover:border-primary/50 hover:shadow-md">
      {/* Decorative Top Accent */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-indigo-500 to-violet-500" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Award className="h-6 w-6" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            Verified Credential
          </span>
        </div>
      </div>

      {/* Event & Certificate Content */}
      <div className="mt-4 space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {certificate.event.category}
        </span>
        <h3 className="line-clamp-2 text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
          {certificate.event.title}
        </h3>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Building className="h-3.5 w-3.5" />
          <span>
            {certificate.organizer.name}
            {certificate.organizer.department ? ` (${certificate.organizer.department})` : ""}
          </span>
        </p>
      </div>

      {/* Metadata strip */}
      <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          Issued {formattedIssueDate}
        </span>
        <span className="font-mono text-[11px] font-semibold text-primary">
          {certificate.certificateCode}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center gap-2 pt-2">
        {/* Direct PDF Download */}
        <a
          href={pdfDownloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[120px]"
        >
          <Button size="sm" className="w-full gap-1.5 text-xs font-semibold">
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </Button>
        </a>

        {/* Public Verify Link */}
        <Link href={publicVerifyUrl} className="flex-1 min-w-[120px]">
          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            Verify Credential
          </Button>
        </Link>

        {/* Copy Link Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyLink}
          className="h-8 w-8 p-0 shrink-0"
          title="Copy Verification Link"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
}
